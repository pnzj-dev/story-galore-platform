import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { CREATOR_BUSINESS_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface CreatorBusinessAgentState extends AgentTaskState {}

export class CreatorBusinessAgent extends StoryGaloreAgent<Env, CreatorBusinessAgentState> {
  protected manifest = CREATOR_BUSINESS_MANIFEST;

  initialState: CreatorBusinessAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async creatorRead(input: unknown): Promise<unknown> {
    this.assertCapability("creator.read");
    this.record("creator.read");
    return this.invokeGateway("creator_get", input);
  }

  @callable()
  async analyticsRead(input: unknown): Promise<unknown> {
    this.assertCapability("analytics.read");
    this.record("analytics.read");
    return this.invokeGateway("analytics_get", input);
  }

  @callable()
  async subscriptionRead(input: unknown): Promise<unknown> {
    this.assertCapability("subscription.read");
    this.record("subscription.read");
    return this.invokeGateway("subscription_get", input);
  }

  @callable()
  async revenueRead(input: unknown): Promise<unknown> {
    this.assertCapability("revenue.read");
    this.record("revenue.read");
    return this.invokeGateway("revenue_get", input);
  }

  @callable()
  async businessPropose(input: unknown): Promise<unknown> {
    this.assertCapability("business.propose");
    const { provenance, policyDecisionId } = this.record("business.propose");
    return {
      kind: "business.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
