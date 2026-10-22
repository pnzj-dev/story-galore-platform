package handler

import (
	"encoding/json"
	"strings"

	"github.com/appwrite/sdk-for-go/tablesdb"
	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

// forbiddenInputFields must never be accepted from a caller; they are the
// trust-boundary fields the gateway derives itself.
var forbiddenInputFields = []string{
	"native_appwrite_tool_name", "access_token", "api_key",
	"arbitrary_endpoint_url", "caller_selected_policy", "caller_selected_agent_role",
}

// Main is the central-agent-gateway entry point: it enforces the single
// authorization path for autonomous-agent access to registered Appwrite MCP
// tools, then delegates the authorized tool call to the self-hosted MCP server.
func Main(ctx openruntimes.Context) openruntimes.Response {
	var in GatewayInput
	if err := ctx.Req.BodyJson(&in); err != nil {
		return ctx.Res.Json(denied("INVALID_INPUT"))
	}
	if in.RequestId == "" || in.TraceId == "" || in.TaskId == "" || in.CapabilityId == "" ||
		in.StorygaloreToolId == "" || in.SchemaVersion == "" || len(in.Input) == 0 {
		return ctx.Res.Json(denied("INVALID_INPUT"))
	}
	if in.IdempotencyKey == nil && strings.HasSuffix(in.StorygaloreToolId, "_create") ||
		in.IdempotencyKey == nil && strings.HasSuffix(in.StorygaloreToolId, "_update") {
		return ctx.Res.Json(denied("MISSING_IDEMPOTENCY_KEY_FOR_MUTATION"))
	}

	// Agent identity is derived from the verified runtime invocation context
	// (server-set x-appwrite-user-id), never from the input payload.
	agentUser := ctx.Req.Headers["x-appwrite-user-id"]
	if agentUser == "" {
		return ctx.Res.Json(denied("UNKNOWN_AGENT"))
	}
	agentSlug := strings.TrimPrefix(agentUser, "agent-")
	if agentSlug == agentUser {
		return ctx.Res.Json(denied("UNKNOWN_AGENT"))
	}

	ctx.Log("central-agent-gateway", "agent="+agentSlug, "tool="+in.StorygaloreToolId)

	// Reject caller-supplied native tool names or trust-boundary fields.
	for _, f := range forbiddenInputFields {
		if strings.Contains(string(in.Input), "\""+f+"\"") {
			return ctx.Res.Json(denied("INVALID_INPUT"))
		}
	}

	// In-process Policy Engine: allowlist + registered tool mapping.
	nativeTool, err := evaluatePolicy(agentSlug, in.StorygaloreToolId)
	if err != nil {
		emitAudit(ctx, in, agentSlug, nativeTool, false, err)
		return ctx.Res.Json(formatDenied(err))
	}

	// Invoke the registered native tool through the self-hosted MCP server.
	client, err := newMcpClient()
	if err != nil {
		emitAudit(ctx, in, agentSlug, nativeTool, false, err)
		return ctx.Res.Json(denied("MCP_SERVER_UNAVAILABLE"))
	}
	defer client.close()

	var args map[string]interface{}
	_ = json.Unmarshal(in.Input, &args)
	result, err := client.call(nativeTool, args)
	if err != nil {
		emitAudit(ctx, in, agentSlug, nativeTool, false, err)
		return ctx.Res.Json(denied("MCP_TOOL_FAILURE"))
	}

	emitAudit(ctx, in, agentSlug, nativeTool, true, nil)

	out := GatewayOutput{
		Status:              "SUCCESS",
		RequestId:           in.RequestId,
		TraceId:             in.TraceId,
		PolicyDecisionId:    in.RequestId + "-decision",
		StorygaloreToolId:   in.StorygaloreToolId,
		ResultSchemaVersion: "1",
		Result:              result,
	}
	return ctx.Res.Json(out)
}

// emitAudit records a normalized gateway decision as a domain event.
func emitAudit(ctx openruntimes.Context, in GatewayInput, agentSlug, nativeTool string, allowed bool, err error) {
	decision := "ALLOW"
	if !allowed {
		decision = "DENY"
	}
	payload := map[string]interface{}{
		"eventType":   "central_agent_gateway.decision.v1",
		"agentSlug":   agentSlug,
		"toolId":      in.StorygaloreToolId,
		"nativeTool":  nativeTool,
		"capabilityId": in.CapabilityId,
		"decision":    decision,
		"correlationId": in.TraceId,
	}
	if err != nil {
		payload["errorCode"] = err.Error()
	}

	cl := newAuditClient(ctx)
	service := tablesdb.New(cl)
	_, _ = service.CreateRow("main", "domain_events", newUUID(), map[string]interface{}{
		"eventId": newUUID(), "eventType": "central_agent_gateway.decision.v1",
		"aggregateId": in.TaskId, "payload": mustJSON(payload),
		"correlationId": in.TraceId, "occurredAt": now(), "deliveryAttempts": 0,
	})
}
