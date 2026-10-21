import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { CODING_DEV_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface CodingDevAgentState extends AgentTaskState {}

export class CodingDevAgent extends StoryGaloreAgent<Env, CodingDevAgentState> {
  protected manifest = CODING_DEV_MANIFEST;

  initialState: CodingDevAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async githubIssueRead(input: unknown): Promise<unknown> {
    this.assertCapability("github.issue.read");
    this.record("github.issue.read");
    // fail-closed: no gateway operation wired for "github.issue.read" yet.
    return this.invokeGateway("github_issue_get", input);
  }

  @callable()
  async repositoryRead(input: unknown): Promise<unknown> {
    this.assertCapability("repository.read");
    this.record("repository.read");
    // fail-closed: no gateway operation wired for "repository.read" yet.
    return this.invokeGateway("repository_get", input);
  }

  @callable()
  async repositoryBranchCreate(input: unknown): Promise<unknown> {
    this.assertCapability("repository.branch.create");
    this.record("repository.branch.create");
    // fail-closed: no gateway operation wired for "repository.branch.create" yet.
    return this.invokeGateway("repository_branch_create", input);
  }

  @callable()
  async repositoryCodeWrite(input: unknown): Promise<unknown> {
    this.assertCapability("repository.code.write");
    this.record("repository.code.write");
    // fail-closed: no gateway operation wired for "repository.code.write" yet.
    return this.invokeGateway("repository_code_write", input);
  }

  @callable()
  async repositoryCommit(input: unknown): Promise<unknown> {
    this.assertCapability("repository.commit");
    this.record("repository.commit");
    // fail-closed: no gateway operation wired for "repository.commit" yet.
    return this.invokeGateway("repository_commit", input);
  }

  @callable()
  async githubPrCreate(input: unknown): Promise<unknown> {
    this.assertCapability("github.pr.create");
    this.record("github.pr.create");
    // fail-closed: no gateway operation wired for "github.pr.create" yet.
    return this.invokeGateway("github_pr_create", input);
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
  async deploymentPrepare(input: unknown): Promise<unknown> {
    this.assertCapability("deployment.prepare");
    this.record("deployment.prepare");
    // fail-closed: no gateway operation wired for "deployment.prepare" yet.
    return this.invokeGateway("deployment_prepare", input);
  }

}
