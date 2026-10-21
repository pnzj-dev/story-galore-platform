/**
 * The two V1 vertical-slice agent manifests, transcribed from
 * `contracts/agents/manifests/story-producer.yaml` + `support.yaml`.
 *
 * These are the authoritative capability sets for the Policy Engine; the full
 * 17-agent family will follow the same shape.
 */
import type { AgentManifest } from './policy';

export const STORY_PRODUCER_MANIFEST: AgentManifest = {
  id: 'sg.agent.story-producer',
  slug: 'story-producer',
  name: 'Story Producer Agent',
  class_name: 'StoryProducerAgent',
  mode: 'ORCHESTRATE',
  mission:
    'Front door for story intake; converts creator input into reviewable structured production plans, including character and world domain capabilities.',
  capabilities: {
    allowed: [
      'project.read',
      'story-bible.read',
      'story-bible.propose',
      'character.propose',
      'world.propose',
      'production-plan.propose',
      'agent.task.delegate',
      'character.read',
      'world.read',
    ],
    forbidden: [
      'admin.arbitrary-db-write',
      'secret.read.plaintext',
      'policy.bypass',
      'entitlement.bypass',
      'age-policy.bypass',
      'moderation.bypass',
      'production.deploy_without_approval',
    ],
  },
  delegation: {
    allowed_agents: ['story-guardian', 'art-director', 'production'],
  },
};

export const SUPPORT_MANIFEST: AgentManifest = {
  id: 'sg.agent.support',
  slug: 'support',
  name: 'Support Agent',
  class_name: 'SupportAgent',
  mode: 'ASSIST',
  mission:
    'Handles support triage, knowledge retrieval, safe ticket updates and escalation to engineering.',
  capabilities: {
    allowed: ['support.ticket.read', 'support.ticket.update', 'knowledge.read', 'ticket.escalate'],
    forbidden: [
      'admin.arbitrary-db-write',
      'secret.read.plaintext',
      'policy.bypass',
      'entitlement.bypass',
      'age-policy.bypass',
      'moderation.bypass',
      'production.deploy_without_approval',
    ],
  },
  delegation: {
    allowed_agents: ['coding-dev', 'community-guardian', 'reader-companion'],
  },
};

export const MANIFESTS: Record<string, AgentManifest> = {
  story_producer: STORY_PRODUCER_MANIFEST,
  support: SUPPORT_MANIFEST,
};
