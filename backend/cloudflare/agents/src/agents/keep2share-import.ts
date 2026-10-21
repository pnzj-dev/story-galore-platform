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
    return this.invokeGateway("import_request_get", input);
  }

  @callable()
  async keep2shareInspect(input: unknown): Promise<unknown> {
    this.assertCapability("keep2share.inspect");
    this.record("keep2share.inspect");
    return this.invokeGateway("keep2share_inspect", input);
  }

  @callable()
  async keep2shareAuthenticate(input: unknown): Promise<unknown> {
    this.assertCapability("keep2share.authenticate");
    this.record("keep2share.authenticate");
    return this.invokeGateway("keep2share_authenticate", input);
  }

  @callable()
  async keep2shareDownload(input: unknown): Promise<unknown> {
    this.assertCapability("keep2share.download");
    this.record("keep2share.download");
    return this.invokeGateway("keep2share_download", input);
  }

  @callable()
  async mediaMetadataNormalize(input: unknown): Promise<unknown> {
    this.assertCapability("media.metadata.normalize");
    this.record("media.metadata.normalize");
    return this.invokeGateway("media_metadata_normalize", input);
  }

  @callable()
  async archiveNormalize(input: unknown): Promise<unknown> {
    this.assertCapability("archive.normalize");
    this.record("archive.normalize");
    return this.invokeGateway("archive_normalize", input);
  }

  @callable()
  async mediaUpload(input: unknown): Promise<unknown> {
    this.assertCapability("media.upload");
    this.record("media.upload");
    return this.invokeGateway("media_upload", input);
  }

  @callable()
  async mediaRegister(input: unknown): Promise<unknown> {
    this.assertCapability("media.register");
    this.record("media.register");
    return this.invokeGateway("media_register", input);
  }

  @callable()
  async moderationSubmit(input: unknown): Promise<unknown> {
    this.assertCapability("moderation.submit");
    this.record("moderation.submit");
    return this.invokeGateway("moderation_submit", input);
  }

}
