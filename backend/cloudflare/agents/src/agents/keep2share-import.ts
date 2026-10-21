import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { KEEP2SHARE_IMPORT_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface Keep2ShareImportAgentState extends AgentTaskState {}

export class Keep2ShareImportAgent extends StoryGaloreAgent<Env, Keep2ShareImportAgentState> {
  protected manifest = KEEP2SHARE_IMPORT_MANIFEST;

  initialState: Keep2ShareImportAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async importRequestRead(input: unknown): Promise<unknown> {
    this.assertCapability("import.request.read");
    this.record("import.request.read");
    // fail-closed: no gateway operation wired for "import.request.read" yet.
    return this.invokeGateway("import_request_get", input);
  }

  @callable()
  async keep2shareInspect(input: unknown): Promise<unknown> {
    this.assertCapability("keep2share.inspect");
    this.record("keep2share.inspect");
    // fail-closed: no gateway operation wired for "keep2share.inspect" yet.
    return this.invokeGateway("keep2share_inspect", input);
  }

  @callable()
  async keep2shareAuthenticate(input: unknown): Promise<unknown> {
    this.assertCapability("keep2share.authenticate");
    this.record("keep2share.authenticate");
    // fail-closed: no gateway operation wired for "keep2share.authenticate" yet.
    return this.invokeGateway("keep2share_authenticate", input);
  }

  @callable()
  async keep2shareDownload(input: unknown): Promise<unknown> {
    this.assertCapability("keep2share.download");
    this.record("keep2share.download");
    // fail-closed: no gateway operation wired for "keep2share.download" yet.
    return this.invokeGateway("keep2share_download", input);
  }

  @callable()
  async mediaMetadataNormalize(input: unknown): Promise<unknown> {
    this.assertCapability("media.metadata.normalize");
    this.record("media.metadata.normalize");
    // fail-closed: no gateway operation wired for "media.metadata.normalize" yet.
    return this.invokeGateway("media_metadata_normalize", input);
  }

  @callable()
  async archiveNormalize(input: unknown): Promise<unknown> {
    this.assertCapability("archive.normalize");
    this.record("archive.normalize");
    // fail-closed: no gateway operation wired for "archive.normalize" yet.
    return this.invokeGateway("archive_normalize", input);
  }

  @callable()
  async mediaUpload(input: unknown): Promise<unknown> {
    this.assertCapability("media.upload");
    this.record("media.upload");
    // fail-closed: no gateway operation wired for "media.upload" yet.
    return this.invokeGateway("media_upload", input);
  }

  @callable()
  async mediaRegister(input: unknown): Promise<unknown> {
    this.assertCapability("media.register");
    this.record("media.register");
    // fail-closed: no gateway operation wired for "media.register" yet.
    return this.invokeGateway("media_register", input);
  }

  @callable()
  async moderationSubmit(input: unknown): Promise<unknown> {
    this.assertCapability("moderation.submit");
    this.record("moderation.submit");
    // fail-closed: no gateway operation wired for "moderation.submit" yet.
    return this.invokeGateway("moderation_submit", input);
  }

}
