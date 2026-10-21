import { routeAgentRequest } from 'agents';
import { ArtDirectorAgent } from './agents/art-director';
import { CeoAgent } from './agents/ceo';
import { CodingDevAgent } from './agents/coding-dev';
import { CommunityGuardianAgent } from './agents/community-guardian';
import { CreatorBusinessAgent } from './agents/creator-business';
import { DataAnalysisReportingAgent } from './agents/data-analysis-reporting';
import { DiscoveryCuratorAgent } from './agents/discovery-curator';
import { InfrastructureAgent } from './agents/infrastructure';
import { Keep2ShareImportAgent } from './agents/keep2share-import';
import { MediaOperationsAgent } from './agents/media-operations';
import { OrchestratorAgent } from './agents/orchestrator';
import { ProductionAgent } from './agents/production';
import { QaReleaseAgent } from './agents/qa-release';
import { ReaderCompanionAgent } from './agents/reader-companion';
import { StoryGuardianAgent } from './agents/story-guardian';
import { StoryProducerAgent } from './agents/story-producer';
import { SupportAgent } from './agents/support';
import type { Env } from './env';

export { ArtDirectorAgent, CeoAgent, CodingDevAgent, CommunityGuardianAgent, CreatorBusinessAgent, DataAnalysisReportingAgent, DiscoveryCuratorAgent, InfrastructureAgent, Keep2ShareImportAgent, MediaOperationsAgent, OrchestratorAgent, ProductionAgent, QaReleaseAgent, ReaderCompanionAgent, StoryGuardianAgent, StoryProducerAgent, SupportAgent };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routeAgentRequest(request, env)) ?? new Response('Not found', { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
