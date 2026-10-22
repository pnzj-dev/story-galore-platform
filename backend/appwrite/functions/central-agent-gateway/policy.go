package handler

import (
	"encoding/json"
)

// GatewayInput is the contract-defined request shape
// (contracts/functions/schemas/central-agent-gateway-input.yaml).
type GatewayInput struct {
	RequestId         string          `json:"request_id"`
	TraceId           string          `json:"trace_id"`
	TaskId            string          `json:"task_id"`
	CapabilityId      string          `json:"capability_id"`
	StorygaloreToolId string          `json:"storygalore_tool_id"`
	SchemaVersion     string          `json:"schema_version"`
	Input             json.RawMessage `json:"input"`
	IdempotencyKey    *string         `json:"idempotency_key"`
	TenantId          *string         `json:"tenant_id"`
	ApprovalReference *string         `json:"approval_reference"`
}

// GatewayOutput is the contract-defined response shape.
type GatewayOutput struct {
	Status             string          `json:"status"`
	RequestId          string          `json:"request_id"`
	TraceId            string          `json:"trace_id"`
	PolicyDecisionId   string          `json:"policy_decision_id"`
	StorygaloreToolId  string          `json:"storygalore_tool_id"`
	ResultSchemaVersion string         `json:"result_schema_version,omitempty"`
	Result             json.RawMessage `json:"result,omitempty"`
	ErrorCode          *string         `json:"error_code,omitempty"`
	Retryable          bool            `json:"retryable,omitempty"`
}

// agentAllowlist maps a canonical agent slug to the stable StoryGalore tool ids
// it may call. Source: contracts/integrations/agent-appwrite-tool-allowlists.yaml
// (deny-by-default). Regenerate from that contract if it changes.
var agentAllowlist = map[string]map[string]bool{
	"story-producer": {
		"stories.read": true, "stories.create_draft": true,
		"story_plans.read": true, "story_plans.create": true,
	},
	"story-guardian":       {"stories.read": true, "continuity.read": true, "moderation.propose": true},
	"art-director":         {"stories.read": true, "art_briefs.read": true, "art_briefs.create_draft": true, "media_metadata.read": true},
	"production":           {"stories.read": true, "production_jobs.read": true, "production_jobs.create_approved": true},
	"community-guardian":   {"community_reports.read_scoped": true, "moderation.propose": true},
	"discovery-curator":    {"published_catalog.read": true, "recommendations.propose": true, "collections.create_draft": true},
	"reader-companion":     {"published_catalog.read": true, "reader_context.read_scoped": true},
	"creator-business":     {"creator_metrics.read_scoped": true, "campaigns.read_scoped": true, "business_reports.create": true},
	"media-operations":     {"media_metadata.read": true, "media_jobs.read": true, "media_jobs.retry_approved": true},
	"support":              {"support_cases.read_scoped": true, "support_cases.update_scoped": true, "support_escalations.create": true},
	"qa-release":           {"release_evidence.read": true, "contract_validation.run": true, "release_readiness.report": true},
	"infrastructure":       {"infrastructure_status.read": true, "approved_operations.read": true, "staging_operation.execute_approved": true},
	"ceo":                  {"executive_reports.read_aggregated": true, "business_reports.read_aggregated": true},
	"data-analysis-reporting": {"analytics.read_approved": true, "economics.read_approved": true, "reports.create": true},
	"coding-dev":           {"appwrite_docs.search": true, "development_resources.read": true, "staging_resources.mutate_approved": true},
	"orchestrator":         {"agent_tasks.read": true, "agent_tasks.create": true, "agent_tasks.delegate_approved": true},
	"keep2share-import":    {"imports.read_own": true, "imports.create": true, "imports.status.read_own": true, "media_upload.initiate_approved": true},
}

// toolMapping maps a stable StoryGalore tool id to a native Appwrite MCP tool
// plus the fixed resource (table) it operates on. Mutation/domain-specific
// tools without a mapping here fail closed (UNREGISTERED_TOOL_MAPPING) until
// their domain adapter is registered in
// contracts/integrations/appwrite-mcp-tool-registry.yaml.
type toolMapping struct {
	native string
	table  string
}

// toolToNative maps a stable StoryGalore tool id to its native tool + table.
// Read tools are mapped to the generic tables_db read operations; the exact
// row_id/queries come from the validated tool input at call time.
//
// Mutation tools (create/update/approve/delegate/execute/propose) are NOT mapped
// here: raw tables_db writes would bypass the api gateway's domain validation.
// They require domain-operation adapters (delegating to the canonical api
// function) and stay fail-closed until each adapter is registered.
var toolToNative = map[string]toolMapping{
	"stories.read":                   {native: "tables_db_get_row", table: "publications"},
	"story_plans.read":               {native: "tables_db_get_row", table: "studio_story_bibles"},
	"media_metadata.read":            {native: "tables_db_list_rows", table: "media_assets"},
	"community_reports.read_scoped":  {native: "tables_db_list_rows", table: "reports"},
	"published_catalog.read":         {native: "tables_db_list_rows", table: "publications"},
	"support_cases.read_scoped":      {native: "tables_db_list_rows", table: "support_tickets"},
	"agent_tasks.read":               {native: "tables_db_list_rows", table: "agent_tasks"},
}

// policyDenied is the safe, non-disclosing denial the gateway returns.
type policyDenied struct {
	Code string
}

func (p policyDenied) Error() string { return p.Code }

// evaluatePolicy enforces the in-process Policy Engine. It fails closed when the
// agent is unknown, the tool is not allowlisted for the agent, or the tool has
// no registered native mapping.
func evaluatePolicy(agentSlug, toolId string) (toolMapping, error) {
	allowed, ok := agentAllowlist[agentSlug]
	if !ok {
		return toolMapping{}, policyDenied{"UNKNOWN_AGENT"}
	}
	if !allowed[toolId] {
		return toolMapping{}, policyDenied{"TOOL_NOT_ALLOWLISTED"}
	}
	mapping, ok := toolToNative[toolId]
	if !ok || mapping.native == "" {
		return toolMapping{}, policyDenied{"UNREGISTERED_TOOL_MAPPING"}
	}
	return mapping, nil
}

func denied(code string) GatewayOutput {
	return GatewayOutput{Status: "FAILED", ErrorCode: &code}
}

func formatDenied(e error) GatewayOutput {
	if d, ok := e.(policyDenied); ok {
		return denied(d.Code)
	}
	return denied("SAFE_FAILURE")
}
