/**
 * In-process Policy Engine (deterministic, fail-closed).
 *
 * Mirrors `contracts/agents/capability-registry.yaml` + the per-agent
 * `contracts/agents/manifests/*.yaml` allowed/forbidden capability sets.
 * Trust never substitutes for authorization: every agent tool call asserts its
 * capability here before any side effect, and unknown capabilities are denied.
 */

export interface AgentManifest {
  id: string;
  slug: string;
  name: string;
  class_name: string;
  mode: 'ORCHESTRATE' | 'PROPOSE' | 'REVIEW' | 'EXECUTE' | 'ASSIST' | 'ANALYZE' | 'ADVISE' | 'VERIFY' | 'IMPLEMENT';
  mission: string;
  capabilities: {
    allowed: string[];
    forbidden: string[];
  };
  delegation: {
    allowed_agents: string[];
  };
}

export class PolicyDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyDeniedError';
  }
}

export class PolicyEngine {
  constructor(private readonly manifest: AgentManifest) {}

  /** Deny a capability unless it is allowed and not forbidden. */
  assertCapability(capability: string): void {
    if (this.manifest.capabilities.forbidden.includes(capability)) {
      throw new PolicyDeniedError(
        `POLICY_DENIED: capability "${capability}" is forbidden for ${this.manifest.id}`,
      );
    }
    if (!this.manifest.capabilities.allowed.includes(capability)) {
      throw new PolicyDeniedError(
        `POLICY_DENIED: capability "${capability}" is not allowed for ${this.manifest.id}`,
      );
    }
  }

  /** Deny delegation to an agent outside the manifest's allowlist. */
  assertDelegation(targetSlug: string): void {
    if (!this.manifest.delegation.allowed_agents.includes(targetSlug)) {
      throw new PolicyDeniedError(
        `POLICY_DENIED: ${this.manifest.id} may not delegate to "${targetSlug}"`,
      );
    }
  }
}
