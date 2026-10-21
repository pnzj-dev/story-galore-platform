import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { INFRASTRUCTURE_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface InfrastructureAgentState extends AgentTaskState {}

export class InfrastructureAgent extends StoryGaloreAgent<Env, InfrastructureAgentState> {
  protected manifest = INFRASTRUCTURE_MANIFEST;

  initialState: InfrastructureAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async infrastructureRead(input: unknown): Promise<unknown> {
    this.assertCapability("infrastructure.read");
    this.record("infrastructure.read");
    return this.invokeGateway("infrastructure_get", input);
  }

  @callable()
  async infrastructureMutate(input: unknown): Promise<unknown> {
    this.assertCapability("infrastructure.mutate");
    this.record("infrastructure.mutate");
    return this.invokeGateway("infrastructure_mutate", input);
  }

  @callable()
  async deploymentPrepare(input: unknown): Promise<unknown> {
    this.assertCapability("deployment.prepare");
    this.record("deployment.prepare");
    return this.invokeGateway("deployment_prepare", input);
  }

  @callable()
  async deploymentStaging(input: unknown): Promise<unknown> {
    this.assertCapability("deployment.staging");
    this.record("deployment.staging");
    return this.invokeGateway("deployment_staging", input);
  }

  @callable()
  async observabilityRead(input: unknown): Promise<unknown> {
    this.assertCapability("observability.read");
    this.record("observability.read");
    return this.invokeGateway("observability_get", input);
  }

  @callable()
  async migrationExecute(input: unknown): Promise<unknown> {
    this.assertCapability("migration.execute");
    this.record("migration.execute");
    return this.invokeGateway("migration_execute", input);
  }

}
