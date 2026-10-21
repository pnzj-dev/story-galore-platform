import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { ORCHESTRATOR_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface OrchestratorAgentState extends AgentTaskState {}

export class OrchestratorAgent extends StoryGaloreAgent<Env, OrchestratorAgentState> {
  protected manifest = ORCHESTRATOR_MANIFEST;

  initialState: OrchestratorAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async agentTaskRead(input: unknown): Promise<unknown> {
    this.assertCapability("agent.task.read");
    this.record("agent.task.read");
    return this.invokeGateway("agent_task_get", input);
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

  @callable()
  async agentApprovalRequest(input: unknown): Promise<unknown> {
    this.assertCapability("agent.approval.request");
    const { provenance, policyDecisionId } = this.record("agent.approval.request");
    return {
      kind: "agent.approval.request",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async agentResultSynthesize(input: unknown): Promise<unknown> {
    this.assertCapability("agent.result.synthesize");
    const { provenance, policyDecisionId } = this.record("agent.result.synthesize");
    return {
      kind: "agent.result.synthesize",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async costRead(input: unknown): Promise<unknown> {
    this.assertCapability("cost.read");
    this.record("cost.read");
    return this.invokeGateway("cost_get", input);
  }

}
