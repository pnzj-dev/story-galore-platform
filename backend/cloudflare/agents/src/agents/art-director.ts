import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { ART_DIRECTOR_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface ArtDirectorAgentState extends AgentTaskState {}

export class ArtDirectorAgent extends StoryGaloreAgent<Env, ArtDirectorAgentState> {
  protected manifest = ART_DIRECTOR_MANIFEST;

  initialState: ArtDirectorAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async storyBibleRead(input: unknown): Promise<unknown> {
    this.assertCapability("story-bible.read");
    this.record("story-bible.read");
    return this.invokeGateway("story_bible_get", input);
  }

  @callable()
  async characterRead(input: unknown): Promise<unknown> {
    this.assertCapability("character.read");
    this.record("character.read");
    return this.invokeGateway("character_list", input);
  }

  @callable()
  async worldRead(input: unknown): Promise<unknown> {
    this.assertCapability("world.read");
    this.record("world.read");
    return this.invokeGateway("world_get", input);
  }

  @callable()
  async styleRead(input: unknown): Promise<unknown> {
    this.assertCapability("style.read");
    this.record("style.read");
    // fail-closed: no gateway operation wired for "style.read" yet.
    return this.invokeGateway("style_get", input);
  }

  @callable()
  async visualPlanPropose(input: unknown): Promise<unknown> {
    this.assertCapability("visual-plan.propose");
    const { provenance, policyDecisionId } = this.record("visual-plan.propose");
    return {
      kind: "visual-plan.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
