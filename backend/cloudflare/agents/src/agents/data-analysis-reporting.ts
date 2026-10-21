import { callable } from 'agents';
import { StoryGaloreAgent, type AgentTaskState } from '../base-agent';
import { DATA_ANALYSIS_REPORTING_MANIFEST } from '../manifests';
import type { Env } from '../env';

interface DataAnalysisReportingAgentState extends AgentTaskState {}

export class DataAnalysisReportingAgent extends StoryGaloreAgent<Env, DataAnalysisReportingAgentState> {
  protected manifest = DATA_ANALYSIS_REPORTING_MANIFEST;

  initialState: DataAnalysisReportingAgentState = {
    taskId: '',
    status: 'IDLE',
    provenance: [],
    policyDecisionId: '',
  };

  @callable()
  async consumerEconomicsRead(input: unknown): Promise<unknown> {
    this.assertCapability("economics.consumer.read");
    this.record("economics.consumer.read");
    // fail-closed: no gateway operation wired for "economics.consumer.read" yet.
    return this.invokeGateway("consumer_economics_get", input);
  }

  @callable()
  async unitEconomicsRead(input: unknown): Promise<unknown> {
    this.assertCapability("economics.unit-economics.read");
    this.record("economics.unit-economics.read");
    // fail-closed: no gateway operation wired for "economics.unit-economics.read" yet.
    return this.invokeGateway("unit_economics_get", input);
  }

  @callable()
  async analyticsRead(input: unknown): Promise<unknown> {
    this.assertCapability("analytics.read");
    this.record("analytics.read");
    // fail-closed: no gateway operation wired for "analytics.read" yet.
    return this.invokeGateway("analytics_get", input);
  }

  @callable()
  async analyticsReportCreate(input: unknown): Promise<unknown> {
    this.assertCapability("analytics.report.create");
    this.record("analytics.report.create");
    // fail-closed: no gateway operation wired for "analytics.report.create" yet.
    return this.invokeGateway("analytics_report_create", input);
  }

  @callable()
  async costRead(input: unknown): Promise<unknown> {
    this.assertCapability("cost.read");
    this.record("cost.read");
    // fail-closed: no gateway operation wired for "cost.read" yet.
    return this.invokeGateway("cost_get", input);
  }

  @callable()
  async reportSchedulePropose(input: unknown): Promise<unknown> {
    this.assertCapability("report.schedule.propose");
    const { provenance, policyDecisionId } = this.record("report.schedule.propose");
    return {
      kind: "report.schedule.propose",
      result: input,
      provenance,
      policyDecisionId,
    };
  }

}
