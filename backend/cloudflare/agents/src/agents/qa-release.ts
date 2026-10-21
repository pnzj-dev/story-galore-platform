import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { QA_RELEASE_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface QaReleaseAgentState extends AgentTaskState {}

export class QaReleaseAgent extends StoryGaloreAgent<Env, QaReleaseAgentState> {
  protected manifest = QA_RELEASE_MANIFEST;

  initialState: QaReleaseAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async repositoryRead(input: unknown): Promise<unknown> {
    this.assertCapability("repository.read");
    this.record("repository.read");
    // fail-closed: no gateway operation wired for "repository.read" yet.
    return this.invokeGateway("repository_get", input);
  }

  @callable()
  async ciRun(input: unknown): Promise<unknown> {
    this.assertCapability("ci.run");
    this.record("ci.run");
    // fail-closed: no gateway operation wired for "ci.run" yet.
    return this.invokeGateway("ci_run", input);
  }

  @callable()
  async contractValidate(input: unknown): Promise<unknown> {
    this.assertCapability("contract.validate");
    const { provenance, policyDecisionId } = this.record("contract.validate");
    return {
      kind: "contract.validate",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async securityValidate(input: unknown): Promise<unknown> {
    this.assertCapability("security.validate");
    const { provenance, policyDecisionId } = this.record("security.validate");
    return {
      kind: "security.validate",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async releaseVerify(input: unknown): Promise<unknown> {
    this.assertCapability("release.verify");
    const { provenance, policyDecisionId } = this.record("release.verify");
    return {
      kind: "release.verify",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

  @callable()
  async githubPrReview(input: unknown): Promise<unknown> {
    this.assertCapability("github.pr.review");
    const { provenance, policyDecisionId } = this.record("github.pr.review");
    return {
      kind: "github.pr.review",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
