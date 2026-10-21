import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { CEO_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface CeoAgentState extends AgentTaskState {}

export class CeoAgent extends StoryGaloreAgent<Env, CeoAgentState> {
  protected manifest = CEO_MANIFEST;

  initialState: CeoAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async economicsSummaryRead(input: unknown): Promise<unknown> {
    this.assertCapability("economics.consumer.read");
    this.record("economics.consumer.read");
    // fail-closed: no gateway operation wired for "economics.consumer.read" yet.
    return this.invokeGateway("economics_summary_get", input);
  }

  @callable()
  async analyticsRead(input: unknown): Promise<unknown> {
    this.assertCapability("analytics.read");
    this.record("analytics.read");
    // fail-closed: no gateway operation wired for "analytics.read" yet.
    return this.invokeGateway("analytics_get", input);
  }

  @callable()
  async costRead(input: unknown): Promise<unknown> {
    this.assertCapability("cost.read");
    this.record("cost.read");
    // fail-closed: no gateway operation wired for "cost.read" yet.
    return this.invokeGateway("cost_get", input);
  }

  @callable()
  async revenueRead(input: unknown): Promise<unknown> {
    this.assertCapability("revenue.read");
    this.record("revenue.read");
    // fail-closed: no gateway operation wired for "revenue.read" yet.
    return this.invokeGateway("revenue_get", input);
  }

  @callable()
  async supportRead(input: unknown): Promise<unknown> {
    this.assertCapability("support.read");
    this.record("support.read");
    // fail-closed: no gateway operation wired for "support.read" yet.
    return this.invokeGateway("support_get", input);
  }

  @callable()
  async executivePropose(input: unknown): Promise<unknown> {
    this.assertCapability("executive.propose");
    const { provenance, policyDecisionId } = this.record("executive.propose");
    return {
      kind: "executive.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
