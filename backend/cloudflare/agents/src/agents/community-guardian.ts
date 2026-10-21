import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { COMMUNITY_GUARDIAN_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface CommunityGuardianAgentState extends AgentTaskState {}

export class CommunityGuardianAgent extends StoryGaloreAgent<Env, CommunityGuardianAgentState> {
  protected manifest = COMMUNITY_GUARDIAN_MANIFEST;

  initialState: CommunityGuardianAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async commentRead(input: unknown): Promise<unknown> {
    this.assertCapability("comment.read");
    this.record("comment.read");
    return this.invokeGateway("comment_get", input);
  }

  @callable()
  async reportRead(input: unknown): Promise<unknown> {
    this.assertCapability("report.read");
    this.record("report.read");
    // fail-closed: no gateway operation wired for "report.read" yet.
    return this.invokeGateway("report_get", input);
  }

  @callable()
  async blockRead(input: unknown): Promise<unknown> {
    this.assertCapability("block.read");
    this.record("block.read");
    // fail-closed: no gateway operation wired for "block.read" yet.
    return this.invokeGateway("block_get", input);
  }

  @callable()
  async moderationReview(input: unknown): Promise<unknown> {
    this.assertCapability("moderation.review");
    const { provenance, policyDecisionId } = this.record("moderation.review");
    return {
      kind: "moderation.review",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async moderationPropose(input: unknown): Promise<unknown> {
    this.assertCapability("moderation.propose");
    const { provenance, policyDecisionId } = this.record("moderation.propose");
    return {
      kind: "moderation.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
