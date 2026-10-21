import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { STORY_GUARDIAN_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface StoryGuardianAgentState extends AgentTaskState {}

export class StoryGuardianAgent extends StoryGaloreAgent<Env, StoryGuardianAgentState> {
  protected manifest = STORY_GUARDIAN_MANIFEST;

  initialState: StoryGuardianAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async projectRead(input: unknown): Promise<unknown> {
    this.assertCapability("project.read");
    this.record("project.read");
    return this.invokeGateway("project_get", input);
  }

  @callable()
  async storyBibleRead(input: unknown): Promise<unknown> {
    this.assertCapability("story-bible.read");
    this.record("story-bible.read");
    return this.invokeGateway("story_bible_get", input);
  }

  @callable()
  async publicationRead(input: unknown): Promise<unknown> {
    this.assertCapability("publication.read");
    this.record("publication.read");
    return this.invokeGateway("publication_get", input);
  }

  @callable()
  async continuityReview(input: unknown): Promise<unknown> {
    this.assertCapability("continuity.review");
    const { provenance, policyDecisionId } = this.record("continuity.review");
    return {
      kind: "continuity.review",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async canonPropose(input: unknown): Promise<unknown> {
    this.assertCapability("canon.propose");
    const { provenance, policyDecisionId } = this.record("canon.propose");
    return {
      kind: "canon.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
