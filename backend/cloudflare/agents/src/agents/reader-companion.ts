import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { READER_COMPANION_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface ReaderCompanionAgentState extends AgentTaskState {}

export class ReaderCompanionAgent extends StoryGaloreAgent<Env, ReaderCompanionAgentState> {
  protected manifest = READER_COMPANION_MANIFEST;

  initialState: ReaderCompanionAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async readerRead(input: unknown): Promise<unknown> {
    this.assertCapability("reader.read");
    this.record("reader.read");
    return this.invokeGateway("reader_get", input);
  }

  @callable()
  async publicationRead(input: unknown): Promise<unknown> {
    this.assertCapability("publication.read");
    this.record("publication.read");
    return this.invokeGateway("publication_get", input);
  }

  @callable()
  async entitlementRead(input: unknown): Promise<unknown> {
    this.assertCapability("entitlement.read");
    this.record("entitlement.read");
    return this.invokeGateway("entitlement_get", input);
  }

  @callable()
  async readerAssist(input: unknown): Promise<unknown> {
    this.assertCapability("reader.assist");
    const { provenance, policyDecisionId } = this.record("reader.assist");
    return {
      kind: "reader.assist",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
