import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { SUPPORT_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface SupportState extends AgentTaskState {}

/**
 * Support Agent (vertical slice). Handles support triage, ticket reads/updates
 * and escalation. Reads/updates go through the authorized gateway; escalation
 * is deterministic until the GitHub-issue escalation path is wired.
 */
export class SupportAgent extends StoryGaloreAgent<Env, SupportState> {
  protected manifest = SUPPORT_MANIFEST;

  initialState: SupportState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async readTicket(ticketId: string): Promise<unknown> {
    this.assertCapability('support.ticket.read');
    this.record('support.ticket.read');
    const out = await this.invokeGateway('support_ticket_get', { ticketId });
    return out;
  }

  @callable()
  async updateTicket(ticketId: string, status: string): Promise<unknown> {
    this.assertCapability('support.ticket.update');
    this.record('support.ticket.update');
    const out = await this.invokeGateway('admin_support_ticket_update', { ticketId, status });
    return out;
  }

  @callable()
  async escalate(ticketId: string, reason: string): Promise<unknown> {
    this.assertCapability('ticket.escalate');
    this.record('ticket.escalate');
    return {
      kind: 'support-escalation',
      escalation: { ticketId, reason, status: 'PROPOSED' },
      provenance: this.state.provenance,
      policyDecisionId: this.state.policyDecisionId,
    };
  }
}
