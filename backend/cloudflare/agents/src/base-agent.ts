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
   * account. The agent forwards its own Appwrite session secret so the gateway
   * derives the actor server-side (SEC-03 full closure) instead of trusting a
   * body actorId claim. Fails closed when not configured.
   */
  protected async invokeGateway<T>(
    operation: string,
    input: unknown,
  ): Promise<GatewayOutput<T>> {
    const env = this.env as unknown as Record<string, string | undefined>;
    const endpoint = env.APPWRITE_ENDPOINT;
    const projectId = env.APPWRITE_PROJECT_ID;
    const apiKey = env.APPWRITE_API_KEY;
    let sessionSecret = '';
    const partA = env.AGENT_SESSION_SECRETS_A;
    const partB = env.AGENT_SESSION_SECRETS_B;
    if (partA || partB) {
      try {
        const secrets = {
          ...(partA ? (JSON.parse(partA) as Record<string, string>) : {}),
          ...(partB ? (JSON.parse(partB) as Record<string, string>) : {}),
        };
        sessionSecret = secrets[this.manifest.slug] ?? '';
      } catch {
        sessionSecret = '';
      }
    }
    if (!endpoint || !projectId || !apiKey || !sessionSecret) {
      return { status: 'FAILED', errorCode: 'GATEWAY_NOT_CONFIGURED' };
    }
    // Forward the agent's own session so the gateway derives the actor
    // server-side (SEC-03 full closure) instead of trusting a body actorId.
    const gw = {
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      session: sessionSecret,
      payload: { operation, input },
    };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    };
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
