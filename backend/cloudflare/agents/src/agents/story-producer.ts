import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { STORY_PRODUCER_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface StoryProducerAgentState extends AgentTaskState {}

export class StoryProducerAgent extends StoryGaloreAgent<Env, StoryProducerAgentState> {
  protected manifest = STORY_PRODUCER_MANIFEST;

  initialState: StoryProducerAgentState = {
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
  async storyBiblePropose(input: unknown): Promise<unknown> {
    this.assertCapability("story-bible.propose");
    const { provenance, policyDecisionId } = this.record("story-bible.propose");
    return {
      kind: "story-bible.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async characterPropose(input: unknown): Promise<unknown> {
    this.assertCapability("character.propose");
    const { provenance, policyDecisionId } = this.record("character.propose");
    return {
      kind: "character.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async worldPropose(input: unknown): Promise<unknown> {
    this.assertCapability("world.propose");
    const { provenance, policyDecisionId } = this.record("world.propose");
    return {
      kind: "world.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async productionPlanPropose(input: unknown): Promise<unknown> {
    this.assertCapability("production-plan.propose");
    const { provenance, policyDecisionId } = this.record("production-plan.propose");
    return {
      kind: "production-plan.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async agentTaskDelegate(input: unknown): Promise<unknown> {
    this.assertCapability("agent.task.delegate");
    const { provenance, policyDecisionId } = this.record("agent.task.delegate");
    return {
      kind: "agent.task.delegate",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
