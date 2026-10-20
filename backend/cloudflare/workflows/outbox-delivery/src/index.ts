import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent, type ExecutionContext } from 'cloudflare:workers';

/**
 * Outbox delivery workflow.
 *
 * Polls the Appwrite `domain_events` outbox for undelivered events and delivers
 * each durably (at-least-once), then marks it delivered. This is the durable
 * half of the hybrid delivery: Appwrite's built-in Realtime already serves live
 * row-change subscribers; this workflow serves webhooks / downstream functions /
 * registered provider adapters.
 *
 * Appwrite access uses a narrowly-scoped API key from Cloudflare Secrets.
 */

type Env = {
  APPWRITE_ENDPOINT: string;
  APPWRITE_PROJECT_ID: string;
  APPWRITE_API_KEY: string;
  /** Shared secret the Appwrite cron presents to trigger this workflow over HTTP. */
  TRIGGER_SECRET?: string;
};

type Params = {
  batchSize?: number;
};

type OutboxEvent = {
  eventId: string;
  eventType: string;
  aggregateId: string;
  payload: string;
  correlationId?: string;
};

const DATABASE = 'main';
const TABLE = 'domain_events';

export class OutboxDeliveryWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
    const batchSize = event.payload.batchSize ?? 50;

    const undelivered = await step.do(
      'poll outbox',
      { retries: { limit: 5, delay: '5 seconds', backoff: 'exponential' } },
      async () => this.listUndelivered(batchSize),
    );

    for (const evt of undelivered) {
      await step.do(
        `deliver ${evt.eventId}`,
        { retries: { limit: 10, delay: '10 seconds', backoff: 'exponential' } },
        async () => {
          await this.deliver(evt);
          await this.markDelivered(evt.eventId);
        },
      );
    }
  }

  async listUndelivered(limit: number): Promise<OutboxEvent[]> {
    const query = JSON.stringify({ method: 'isNull', attribute: 'deliveredAt' });
    const url =
      `${this.env.APPWRITE_ENDPOINT}/tablesdb/${DATABASE}/tables/${TABLE}/rows` +
      `?queries[]=${encodeURIComponent(query)}&limit=${limit}`;

    const res = await fetch(url, {
      headers: this.appwriteHeaders(),
    });
    if (!res.ok) throw new Error(`list undelivered failed: ${res.status}`);

    const body = (await res.json()) as { rows?: Array<Record<string, unknown>> };
    return (body.rows ?? []).map((r) => ({
      eventId: String(r.$id),
      eventType: String(r.eventType ?? ''),
      aggregateId: String(r.aggregateId ?? ''),
      payload: String(r.payload ?? '{}'),
      correlationId: r.correlationId ? String(r.correlationId) : undefined,
    }));
  }

  // TODO: dispatch to registered delivery targets (webhooks, downstream
  // function triggers, provider adapters). Skeleton logs only.
  async deliver(evt: OutboxEvent): Promise<void> {
    console.log(`[outbox-delivery] ${evt.eventType} aggregate=${evt.aggregateId} id=${evt.eventId}`);
  }

  async markDelivered(eventId: string): Promise<void> {
    const url = `${this.env.APPWRITE_ENDPOINT}/tablesdb/${DATABASE}/tables/${TABLE}/rows/${eventId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...this.appwriteHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ data: { deliveredAt: new Date().toISOString() } }),
    });
    if (!res.ok) throw new Error(`mark delivered failed: ${res.status}`);
  }

  appwriteHeaders(): Record<string, string> {
    return {
      'x-appwrite-project': this.env.APPWRITE_PROJECT_ID,
      'x-appwrite-key': this.env.APPWRITE_API_KEY,
      'accept': 'application/json',
    };
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
    const instance = await (ctx as unknown as { exports: { OutboxDeliveryWorkflow: { create: (o?: unknown) => Promise<{ id: string }> } } })
      .exports.OutboxDeliveryWorkflow.create({});
    return Response.json({ id: instance.id });
  },
};
