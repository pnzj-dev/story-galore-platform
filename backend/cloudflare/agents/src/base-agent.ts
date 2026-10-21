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

  /** Append a provenance entry + fresh policy decision id. */
  protected record(capability: string): void {
    this.setState({
      ...this.state,
      provenance: [...(this.state.provenance ?? []), `${new Date().toISOString()} ${capability}`],
      policyDecisionId: crypto.randomUUID(),
    } as State);
  }

  /**
   * Delegate to the `api` gateway function (authorized domain operation) using
   * the admin service-account actor. Fails closed when the gateway credentials
   * are not configured.
   */
  protected async invokeGateway<T>(
    operation: string,
    input: unknown,
  ): Promise<GatewayOutput<T>> {
    const env = this.env as unknown as Record<string, string | undefined>;
    const endpoint = env.APPWRITE_ENDPOINT;
    const projectId = env.APPWRITE_PROJECT_ID;
    const apiKey = env.APPWRITE_API_KEY;
    const adminActor = env.ADMIN_ACTOR_ID;
    if (!endpoint || !projectId || !apiKey || !adminActor) {
      return { status: 'FAILED', errorCode: 'GATEWAY_NOT_CONFIGURED' };
    }
    const gw = {
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      actorId: adminActor,
      payload: { operation, input },
    };
    const res = await fetch(`${endpoint}/functions/api/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
      },
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
