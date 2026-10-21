import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { STORY_PRODUCER_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface StoryProducerState extends AgentTaskState {}

interface ProposalResult {
  kind: string;
  proposal: unknown;
  provenance: string[];
  policyDecisionId: string;
}

/**
 * Story Producer (vertical slice). Front door for story intake; converts
 * creator input into structured, reviewable proposals for the story bible,
 * characters, world and the production plan. Deterministic: it proposes — the
 * authoritative system authorizes.
 */
export class StoryProducerAgent extends StoryGaloreAgent<Env, StoryProducerState> {
  protected manifest = STORY_PRODUCER_MANIFEST;

  initialState: StoryProducerState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async readStoryBible(projectId: string): Promise<unknown> {
    this.assertCapability('story-bible.read');
    this.record('story-bible.read');
    const out = await this.invokeGateway('story_bible_get', { projectId });
    return out;
  }

  @callable()
  async proposeStoryBible(input: {
    projectId: string;
    premise: string;
    themes: string;
    tone: string;
  }): Promise<ProposalResult> {
    this.assertCapability('story-bible.propose');
    this.record('story-bible.propose');
    return {
      kind: 'story-bible-proposal',
      proposal: { ...input, status: 'PROPOSED' },
      provenance: this.state.provenance,
      policyDecisionId: this.state.policyDecisionId,
    };
  }

  @callable()
  async proposeCharacter(input: {
    projectId: string;
    name: string;
    description: string;
  }): Promise<ProposalResult> {
    this.assertCapability('character.propose');
    this.record('character.propose');
    return {
      kind: 'character-proposal',
      proposal: { ...input, status: 'PROPOSED' },
      provenance: this.state.provenance,
      policyDecisionId: this.state.policyDecisionId,
    };
  }

  @callable()
  async proposeWorld(input: {
    projectId: string;
    name: string;
    description: string;
    locations: string;
    rules: string;
  }): Promise<ProposalResult> {
    this.assertCapability('world.propose');
    this.record('world.propose');
    return {
      kind: 'world-proposal',
      proposal: { ...input, status: 'PROPOSED' },
      provenance: this.state.provenance,
      policyDecisionId: this.state.policyDecisionId,
    };
  }

  @callable()
  async proposeProductionPlan(input: { projectId: string; steps: string[] }): Promise<ProposalResult> {
    this.assertCapability('production-plan.propose');
    this.record('production-plan.propose');
    return {
      kind: 'production-plan-proposal',
      proposal: { ...input, status: 'PROPOSED' },
      provenance: this.state.provenance,
      policyDecisionId: this.state.policyDecisionId,
    };
  }
}
