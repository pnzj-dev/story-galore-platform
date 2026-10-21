import type { AgentNamespace } from 'agents';
import type { StoryProducerAgent } from './agents/story-producer';
import type { SupportAgent } from './agents/support';

/**
 * Worker environment. The two durable-object bindings are required by
 * `routeAgentRequest`; the Appwrite gateway credentials are optional (agents
 * fail closed when they are not configured, so local dev works without
 * production secrets).
 */
export type Env = {
  StoryProducerAgent: AgentNamespace<StoryProducerAgent>;
  SupportAgent: AgentNamespace<SupportAgent>;
  APPWRITE_ENDPOINT?: string;
  APPWRITE_PROJECT_ID?: string;
  APPWRITE_API_KEY?: string;
  ADMIN_ACTOR_ID?: string;
};
