import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { SUPPORT_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface SupportAgentState extends AgentTaskState {}

export class SupportAgent extends StoryGaloreAgent<Env, SupportAgentState> {
  protected manifest = SUPPORT_MANIFEST;

  initialState: SupportAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async supportTicketRead(input: unknown): Promise<unknown> {
    this.assertCapability("support.ticket.read");
    this.record("support.ticket.read");
    return this.invokeGateway("support_ticket_get", input);
  }

  @callable()
  async supportTicketUpdate(input: unknown): Promise<unknown> {
    this.assertCapability("support.ticket.update");
    this.record("support.ticket.update");
    return this.invokeGateway("admin_support_ticket_update", input);
  }

  @callable()
  async knowledgeRead(input: unknown): Promise<unknown> {
    this.assertCapability("knowledge.read");
    this.record("knowledge.read");
    // fail-closed: no gateway operation wired for "knowledge.read" yet.
    return this.invokeGateway("knowledge_get", input);
  }

  @callable()
  async ticketEscalate(input: unknown): Promise<unknown> {
    this.assertCapability("ticket.escalate");
    const { provenance, policyDecisionId } = this.record("ticket.escalate");
    return {
      kind: "ticket.escalate",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
