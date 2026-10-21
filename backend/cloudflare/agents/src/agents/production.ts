import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { PRODUCTION_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface ProductionAgentState extends AgentTaskState {}

export class ProductionAgent extends StoryGaloreAgent<Env, ProductionAgentState> {
  protected manifest = PRODUCTION_MANIFEST;

  initialState: ProductionAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async productionPlanRead(input: unknown): Promise<unknown> {
    this.assertCapability("production-plan.read");
    this.record("production-plan.read");
    return this.invokeGateway("production_plan_get", input);
  }

  @callable()
  async draftRead(input: unknown): Promise<unknown> {
    this.assertCapability("draft.read");
    this.record("draft.read");
    return this.invokeGateway("draft_get", input);
  }

  @callable()
  async mediaRead(input: unknown): Promise<unknown> {
    this.assertCapability("media.read");
    this.record("media.read");
    return this.invokeGateway("media_get", input);
  }

  @callable()
  async generationExecute(input: unknown): Promise<unknown> {
    this.assertCapability("generation.execute");
    this.record("generation.execute");
    return this.invokeGateway("generation_execute", input);
  }

  @callable()
  async draftMutate(input: unknown): Promise<unknown> {
    this.assertCapability("draft.mutate");
    this.record("draft.mutate");
    return this.invokeGateway("draft_mutate", input);
  }

}
