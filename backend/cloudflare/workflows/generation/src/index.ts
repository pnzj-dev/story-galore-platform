import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

/**
 * AI generation workflow (durable runner).
 *
 * Polls the gateway for RESERVED (credit-eligible) generation requests and
 * drives each through the generation state machine: RESERVED -> PROCESSING ->
 * COMPLETED (settle) or FAILED (refund). The actual provider/model call is a
 * separate registered adapter; until one is registered the workflow fails
 * closed rather than fabricating an output.
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
      }))
      .filter((g) => g.status === 'RESERVED');
  }

  async process(gen: GenerationRequest): Promise<void> {
    // RESERVED -> PROCESSING (start the generation).
    const proc = await this.invokeGateway<{ status?: string }>('generation_process', {
      generationId: gen.requestId,
    });
    if (proc.status !== 'SUCCESS') throw new Error(`generation_process failed: ${proc.errorCode}`);

    // TODO: invoke the registered provider/model connector here. Until one is
    // registered, fail closed — no generation output is fabricated.
    const fail = await this.invokeGateway<{ status?: string }>('generation_fail', {
      generationId: gen.requestId,
    });
    if (fail.status !== 'SUCCESS') throw new Error(`generation_fail failed: ${fail.errorCode}`);
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
