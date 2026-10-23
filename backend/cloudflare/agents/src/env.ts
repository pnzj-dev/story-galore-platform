import type { AgentNamespace } from 'agents';
import type { ArtDirectorAgent } from './agents/art-director';
import type { CeoAgent } from './agents/ceo';
import type { CodingDevAgent } from './agents/coding-dev';
import type { CommunityGuardianAgent } from './agents/community-guardian';
import type { CreatorBusinessAgent } from './agents/creator-business';
import type { DataAnalysisReportingAgent } from './agents/data-analysis-reporting';
import type { DiscoveryCuratorAgent } from './agents/discovery-curator';
import type { InfrastructureAgent } from './agents/infrastructure';
import type { Keep2ShareImportAgent } from './agents/keep2share-import';
import type { MediaOperationsAgent } from './agents/media-operations';
import type { OrchestratorAgent } from './agents/orchestrator';
import type { ProductionAgent } from './agents/production';
import type { QaReleaseAgent } from './agents/qa-release';
import type { ReaderCompanionAgent } from './agents/reader-companion';
import type { StoryGuardianAgent } from './agents/story-guardian';
import type { StoryProducerAgent } from './agents/story-producer';
import type { SupportAgent } from './agents/support';

/**
 * Worker environment. Each durable-object binding is required by
 * `routeAgentRequest`; the Appwrite gateway credentials are optional (agents
 * fail closed when they are not configured, so local dev works without
 * production secrets).
 */
export type Env = {
  ArtDirectorAgent: AgentNamespace<ArtDirectorAgent>;
  CeoAgent: AgentNamespace<CeoAgent>;
  CodingDevAgent: AgentNamespace<CodingDevAgent>;
  CommunityGuardianAgent: AgentNamespace<CommunityGuardianAgent>;
  CreatorBusinessAgent: AgentNamespace<CreatorBusinessAgent>;
  DataAnalysisReportingAgent: AgentNamespace<DataAnalysisReportingAgent>;
  DiscoveryCuratorAgent: AgentNamespace<DiscoveryCuratorAgent>;
  InfrastructureAgent: AgentNamespace<InfrastructureAgent>;
  Keep2ShareImportAgent: AgentNamespace<Keep2ShareImportAgent>;
  MediaOperationsAgent: AgentNamespace<MediaOperationsAgent>;
  OrchestratorAgent: AgentNamespace<OrchestratorAgent>;
  ProductionAgent: AgentNamespace<ProductionAgent>;
  QaReleaseAgent: AgentNamespace<QaReleaseAgent>;
  ReaderCompanionAgent: AgentNamespace<ReaderCompanionAgent>;
  StoryGuardianAgent: AgentNamespace<StoryGuardianAgent>;
  StoryProducerAgent: AgentNamespace<StoryProducerAgent>;
  SupportAgent: AgentNamespace<SupportAgent>;
  APPWRITE_ENDPOINT?: string;
  APPWRITE_PROJECT_ID?: string;
  APPWRITE_API_KEY?: string;
  /** JSON maps of agent slug -> Appwrite session secret (SEC-03 server-derived actor). Split to respect the 5.1 kB secret limit. */
  AGENT_SESSION_SECRETS_A?: string;
  AGENT_SESSION_SECRETS_B?: string;
};
