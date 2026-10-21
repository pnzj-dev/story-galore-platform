import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { MEDIA_OPERATIONS_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface MediaOperationsAgentState extends AgentTaskState {}

export class MediaOperationsAgent extends StoryGaloreAgent<Env, MediaOperationsAgentState> {
  protected manifest = MEDIA_OPERATIONS_MANIFEST;

  initialState: MediaOperationsAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async deliveryEconomicsRead(input: unknown): Promise<unknown> {
    this.assertCapability("economics.media-cost.read");
    this.record("economics.media-cost.read");
    // fail-closed: no gateway operation wired for "economics.media-cost.read" yet.
    return this.invokeGateway("delivery_economics_get", input);
  }

  @callable()
  async mediaRead(input: unknown): Promise<unknown> {
    this.assertCapability("media.read");
    this.record("media.read");
    return this.invokeGateway("media_asset_list", input);
  }

  @callable()
  async mediaMutate(input: unknown): Promise<unknown> {
    this.assertCapability("media.mutate");
    this.record("media.mutate");
    // fail-closed: no gateway operation wired for "media.mutate" yet.
    return this.invokeGateway("media_mutate", input);
  }

  @callable()
  async distributionRead(input: unknown): Promise<unknown> {
    this.assertCapability("distribution.read");
    this.record("distribution.read");
    // fail-closed: no gateway operation wired for "distribution.read" yet.
    return this.invokeGateway("distribution_get", input);
  }

  @callable()
  async distributionRepair(input: unknown): Promise<unknown> {
    this.assertCapability("distribution.repair");
    this.record("distribution.repair");
    // fail-closed: no gateway operation wired for "distribution.repair" yet.
    return this.invokeGateway("distribution_repair", input);
  }

  @callable()
  async metadataNormalize(input: unknown): Promise<unknown> {
    this.assertCapability("metadata.normalize");
    this.record("metadata.normalize");
    // fail-closed: no gateway operation wired for "metadata.normalize" yet.
    return this.invokeGateway("metadata_normalize", input);
  }

}
