import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent, type ExecutionContext } from 'cloudflare:workers';

/**
 * Prompt redaction workflow.
 *
 * Runs daily and asks the gateway to redact prompts whose generation reached a
 * terminal state more than the retention window ago (see
 * docs/AI_PROMPT_RETENTION.md). The redaction itself is a server-side, authorized
 * data operation (prompt_redact_expired) — this workflow only schedules it.
 */

type Env = {
  APPWRITE_ENDPOINT: string;
  APPWRITE_PROJECT_ID: string;
  APPWRITE_API_KEY: string;
  /** Admin session secret (server-derived actor for the api gateway, SEC-03). */
  ADMIN_SESSION_SECRET: string;
  /** Shared secret the Appwrite cron presents to trigger this workflow over HTTP. */
  TRIGGER_SECRET?: string;
};

type Params = Record<string, never>;

interface GatewayOutput<T = unknown> {
  status: string;
  result: T;
  errorCode: string | null;
}

export class PromptRedactionWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
    await step.do(
      'redact expired prompts',
      { retries: { limit: 5, delay: '1 minute', backoff: 'exponential' } },
      async () => this.redact(),
    );
  }

  async redact(): Promise<void> {
    const out = await this.invokeGateway<{ redacted?: number }>('prompt_redact_expired', {});
    if (out.status !== 'SUCCESS') throw new Error(`prompt_redact_expired failed: ${out.errorCode}`);
    console.log(`[prompt-redaction] redacted ${out.result?.redacted ?? 0} prompts`);
  }

  async invokeGateway<T>(operation: string, input: unknown): Promise<GatewayOutput<T>> {
    const gw = {
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      session: this.env.ADMIN_SESSION_SECRET,
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
 * HTTP trigger (scheduled by the Appwrite cron). POST with
 * `Authorization: Bearer <TRIGGER_SECRET>` creates a workflow instance.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const expected = env.TRIGGER_SECRET ?? '';
    const auth = request.headers.get('Authorization') ?? '';
    if (!expected || auth !== `Bearer ${expected}`) {
      return new Response('unauthorized', { status: 401 });
    }
    if (request.method !== 'POST') {
      return new Response('method not allowed', { status: 405 });
    }
    const instance = await (ctx as unknown as { exports: { PromptRedactionWorkflow: { create: (o?: unknown) => Promise<{ id: string }> } } })
      .exports.PromptRedactionWorkflow.create({});
    return Response.json({ id: instance.id });
  },
};
