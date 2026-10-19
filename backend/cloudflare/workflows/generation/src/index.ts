import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

/**
 * AI generation workflow (durable runner).
 *
 * Polls the gateway for RESERVED (credit-eligible) generation requests and
 * drives each through the generation state machine: RESERVED -> PROCESSING ->
 * COMPLETED (write output + settle) or FAILED (refund).
 *
 * The OpenAI-compatible connector resolves the provider + credential (from the
 * PROVIDER_CREDENTIALS secret) and calls the provider over https. It fails
 * closed when no credit-eligible provider or credential is configured.
 *
 * Appwrite access goes through the `api` gateway function (authorized domain
 * operations) using a narrowly-scoped API key and the admin service-account
 * actor from Cloudflare Secrets.
 */

type Env = {
  APPWRITE_ENDPOINT: string;
  APPWRITE_PROJECT_ID: string;
  APPWRITE_API_KEY: string;
  ADMIN_ACTOR_ID: string;
  /** JSON map of provider credential reference -> API key (Cloudflare Secret). */
  PROVIDER_CREDENTIALS?: string;
  /** Default model id for OpenAI-compatible providers. */
  DEFAULT_MODEL_ID?: string;
};

type Params = {
  batchSize?: number;
};

interface GatewayOutput<T = unknown> {
  status: string;
  result: T;
  errorCode: string | null;
}

interface GenerationRequest {
  requestId: string;
  status: string;
  billingMode: string;
  prompt: string;
  targetType: string;
}

export class GenerationWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
    const batchSize = event.payload.batchSize ?? 20;

    const reserved = await step.do(
      'list reserved generations',
      { retries: { limit: 5, delay: '5 seconds', backoff: 'exponential' } },
      async () => this.listReserved(),
    );

    for (const gen of reserved.slice(0, batchSize)) {
      await step.do(
        `process ${gen.requestId}`,
        { retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' } },
        async () => this.process(gen),
      );
    }
  }

  async listReserved(): Promise<GenerationRequest[]> {
    const out = await this.invokeGateway<{ items?: Array<Record<string, unknown>> }>(
      'generation_list_pending',
      {},
    );
    if (out.status !== 'SUCCESS') throw new Error(`generation_list_pending failed: ${out.errorCode}`);
    return (out.result?.items ?? [])
      .map((r) => ({
        requestId: String(r.requestId ?? ''),
        status: String(r.status ?? ''),
        billingMode: String(r.billingMode ?? ''),
        prompt: String(r.prompt ?? ''),
        targetType: String(r.targetType ?? ''),
      }))
      .filter((g) => g.status === 'RESERVED');
  }

  async process(gen: GenerationRequest): Promise<void> {
    // RESERVED -> PROCESSING (start the generation).
    const proc = await this.invokeGateway<{ status?: string }>('generation_process', {
      generationId: gen.requestId,
    });
    if (proc.status !== 'SUCCESS') throw new Error(`generation_process failed: ${proc.errorCode}`);

    // Resolve the credit-eligible provider from the server-side catalog.
    const provider = await this.resolveProvider();
    if (!provider) {
      await this.failClosed(gen, 'no credit-eligible provider registered');
      return;
    }

    // Invoke the provider and record the output (or fail closed).
    try {
      const { text, model } = await this.invokeProvider(provider, gen);
      const done = await this.invokeGateway<{ outputId?: string }>('generation_complete', {
        generationId: gen.requestId,
        providerId: String(provider.providerId ?? ''),
        modelId: model,
        outputRef: text,
      });
      if (done.status !== 'SUCCESS') throw new Error(`generation_complete failed: ${done.errorCode}`);
    } catch (err) {
      console.log(`[generation] provider error for ${gen.requestId}: ${err}`);
      await this.failClosed(gen, 'provider invocation failed');
    }
  }

  async invokeProvider(
    provider: Record<string, unknown>,
    gen: GenerationRequest,
  ): Promise<{ text: string; model: string }> {
    const endpoint = String(provider.endpointRef ?? '');
    if (!endpoint) throw new Error('provider has no endpointRef');
    const protocol = String(provider.protocol ?? '');
    if (protocol !== 'OPENAI_COMPATIBLE') throw new Error(`unsupported protocol ${protocol}`);

    const credentials = JSON.parse(this.env.PROVIDER_CREDENTIALS ?? '{}') as Record<string, string>;
    const credKey = String(provider.credentialRef ?? provider.providerId ?? '');
    const apiKey = credentials[credKey];
    if (!apiKey) throw new Error('no credential for provider');

    const model = this.env.DEFAULT_MODEL_ID ?? '';
    if (!model) throw new Error('no default model configured');

    // SSRF guard: https only, and reject literal private/loopback/link-local hosts.
    let baseUrl: URL;
    try {
      baseUrl = new URL(endpoint);
    } catch {
      throw new Error('provider endpoint is not a valid URL');
    }
    if (baseUrl.protocol !== 'https:') throw new Error('provider endpoint must be https');
    if (isPrivateHost(baseUrl.hostname)) throw new Error('provider endpoint must not be a private/loopback host');

    const res = await fetch(`${baseUrl.origin}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: gen.prompt }] }),
    });
    if (!res.ok) throw new Error(`provider HTTP ${res.status}`);
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { text: data.choices?.[0]?.message?.content ?? '', model };
  }

  async resolveProvider(): Promise<Record<string, unknown> | null> {
    const out = await this.invokeGateway<{ items?: Array<Record<string, unknown>> }>(
      'ai_provider_list',
      {},
    );
    if (out.status !== 'SUCCESS') throw new Error(`ai_provider_list failed: ${out.errorCode}`);
    const providers = out.result?.items ?? [];
    return (
      providers.find(
        (p) =>
          String(p.status ?? '') === 'ACTIVE' &&
          String(p.executionLocation ?? '') === 'CLOUD' &&
          String(p.ownerType ?? '') === 'STORYGALORE' &&
          p.creditEligible === true,
      ) ?? null
    );
  }

  async failClosed(gen: GenerationRequest, reason: string): Promise<void> {
    const fail = await this.invokeGateway<{ status?: string }>('generation_fail', {
      generationId: gen.requestId,
    });
    if (fail.status !== 'SUCCESS') throw new Error(`generation_fail failed: ${fail.errorCode}`);
    console.log(`[generation] failed ${gen.requestId}: ${reason}`);
  }

  async invokeGateway<T>(operation: string, input: unknown): Promise<GatewayOutput<T>> {
    const gw = {
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      actorId: this.env.ADMIN_ACTOR_ID,
      payload: { operation, input },
    };
    const res = await fetch(`${this.env.APPWRITE_ENDPOINT}/functions/api/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': this.env.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': this.env.APPWRITE_API_KEY,
      },
      body: JSON.stringify({ body: JSON.stringify(gw), async: false }),
    });
    if (!res.ok) throw new Error(`gateway ${operation} failed: HTTP ${res.status}`);
    const execution = (await res.json()) as { responseBody?: string };
    return JSON.parse(execution.responseBody ?? '{}') as GatewayOutput<T>;
  }
}

/**
 * Reject literal private, loopback, link-local, and reserved IP hosts.
 * DNS-resolved hostnames are not checked here (the fetch goes through
 * Cloudflare's network); BYOK/user-supplied endpoints will need a stronger
 * guard before they are enabled.
 */
function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost') return true;
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a >= 224) return true; // multicast/reserved
  }
  if (hostname.includes(':')) {
    if (hostname === '::1') return true; // IPv6 loopback
    const lower = hostname.toLowerCase();
    if (lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
  }
  return false;
}
