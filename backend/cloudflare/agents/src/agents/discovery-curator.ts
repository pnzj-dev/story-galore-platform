import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { DISCOVERY_CURATOR_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface DiscoveryCuratorAgentState extends AgentTaskState {}

export class DiscoveryCuratorAgent extends StoryGaloreAgent<Env, DiscoveryCuratorAgentState> {
  protected manifest = DISCOVERY_CURATOR_MANIFEST;

  initialState: DiscoveryCuratorAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async publicationRead(input: unknown): Promise<unknown> {
    this.assertCapability("publication.read");
    this.record("publication.read");
    return this.invokeGateway("publication_get", input);
  }

  @callable()
  async profileRead(input: unknown): Promise<unknown> {
    this.assertCapability("profile.read");
    this.record("profile.read");
    return this.invokeGateway("profile_get", input);
  }

  @callable()
  async analyticsRead(input: unknown): Promise<unknown> {
    this.assertCapability("analytics.read");
    this.record("analytics.read");
    return this.invokeGateway("analytics_get", input);
  }

  @callable()
  async discoveryPropose(input: unknown): Promise<unknown> {
    this.assertCapability("discovery.propose");
    const { provenance, policyDecisionId } = this.record("discovery.propose");
    return {
      kind: "discovery.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
