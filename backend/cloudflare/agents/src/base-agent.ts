import { Agent } from 'agents';
import { PolicyEngine, type AgentManifest } from './policy';
import type { Env } from './env';

export interface AgentTaskState {
  taskId: string;
  status: string;
  provenance: string[];
  policyDecisionId: string;
}

interface GatewayOutput<T = unknown> {
  status: string;
  result?: T;
  errorCode?: string | null;
}

/**
 * Base class for StoryGalore native agents. Every tool call asserts its
 * capability through the in-process Policy Engine before any side effect, and
 * records provenance + a policy-decision id. Trust never substitutes for
 * authorization.
 */
export abstract class StoryGaloreAgent<
  E extends Env,
  State extends AgentTaskState,
> extends Agent<E, State> {
  protected abstract manifest: AgentManifest;

  protected policyEngine(): PolicyEngine {
    return new PolicyEngine(this.manifest);
  }

  protected assertCapability(capability: string): void {
    this.policyEngine().assertCapability(capability);
  }

  /**
   * The agent's gateway actor identity: an Appwrite user id `agent-{slug}`
   * carrying the alphanumeric label `agent` + slug-with-hyphens-stripped (e.g.
   * `agentstoryproducer`). The `api` gateway resolves that label to enforce the
   * per-agent operation allowlist (generated agent_auth.go). Agents must never
   * act as the admin service account.
   */
  protected get actorId(): string {
    return `agent-${this.manifest.slug}`;
  }

  /**
   * Append a provenance entry + fresh policy decision id, persist it, and
   * return the recorded values (the Durable Object state snapshot may not
   * reflect `setState` synchronously, so callers use the return value).
   */
  protected record(capability: string): { provenance: string[]; policyDecisionId: string } {
    const provenance = [
      ...(this.state.provenance ?? []),
      `${new Date().toISOString()} ${capability}`,
    ];
    const policyDecisionId = crypto.randomUUID();
    this.setState({ ...this.state, provenance, policyDecisionId } as State);
    return { provenance, policyDecisionId };
  }

  /**
   * Delegate to the `api` gateway function (authorized domain operation) using
   * the agent's own narrowly-scoped actor (`agent-{slug}`), never the admin
   * account. When a per-agent session JWT is configured it is passed so the
   * gateway derives the actor from the server-set `x-appwrite-user-id` (not the
   * body claim); otherwise it falls back to the API key + body actor claim.
   * Fails closed when neither is configured.
   */
  protected async invokeGateway<T>(
    operation: string,
    input: unknown,
  ): Promise<GatewayOutput<T>> {
    const env = this.env as unknown as Record<string, string | undefined>;
    const endpoint = env.APPWRITE_ENDPOINT;
    const projectId = env.APPWRITE_PROJECT_ID;
    const apiKey = env.APPWRITE_API_KEY;
    const jwt = env.AGENT_SESSION_JWT;
    if (!endpoint || !projectId || (!apiKey && !jwt)) {
      return { status: 'FAILED', errorCode: 'GATEWAY_NOT_CONFIGURED' };
    }
    const gw = {
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      actorId: this.actorId,
      payload: { operation, input },
    };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
    };
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    } else {
      headers['X-Appwrite-Key'] = apiKey!;
    }
    const res = await fetch(`${endpoint}/functions/api/executions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: JSON.stringify(gw), async: false }),
    });
    if (!res.ok) return { status: 'FAILED', errorCode: `GATEWAY_HTTP_${res.status}` };
    const execution = (await res.json()) as { responseBody?: string };
    try {
      return JSON.parse(execution.responseBody ?? '{}') as GatewayOutput<T>;
    } catch {
      return { status: 'FAILED', errorCode: 'GATEWAY_INVALID_RESPONSE' };
    }
  }
}
