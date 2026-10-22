"""Central Agent Gateway: the single authorization path for autonomous-agent
access to registered Appwrite MCP tools."""

import json
import uuid
from datetime import datetime, timezone

from policy import PolicyDenied, evaluate_policy
from mcp_client import call_tool

FORBIDDEN_FIELDS = [
    "native_appwrite_tool_name", "access_token", "api_key",
    "arbitrary_endpoint_url", "caller_selected_policy", "caller_selected_agent_role",
]

REQUIRED_FIELDS = ["request_id", "trace_id", "task_id", "capability_id", "storygalore_tool_id", "schema_version", "input"]

MUTATION_SUFFIXES = ("_create", "_update")


def _denied(code):
    return {"status": "FAILED", "error_code": code}


async def main(context):
    context.log("central-agent-gateway")
    body = _parse_body(context)
    headers = context.req.headers or {}

    missing = [f for f in REQUIRED_FIELDS if not body.get(f)]
    if missing:
        return context.res.json(_denied("INVALID_INPUT"))

    tool_id = body["storygalore_tool_id"]
    if tool_id.endswith(MUTATION_SUFFIXES) and not body.get("idempotency_key"):
        return context.res.json(_denied("MISSING_IDEMPOTENCY_KEY_FOR_MUTATION"))

    # Agent identity is derived from the verified runtime context, never the body.
    agent_user = headers.get("x-appwrite-user-id", "")
    if not agent_user or not agent_user.startswith("agent-"):
        return context.res.json(_denied("UNKNOWN_AGENT"))
    agent_slug = agent_user[len("agent-"):]

    context.log("agent=%s tool=%s" % (agent_slug, tool_id))

    # Reject caller-supplied native tool names / trust-boundary fields.
    raw_input = json.dumps(body.get("input", {}))
    if any('"%s"' % f in raw_input for f in FORBIDDEN_FIELDS):
        return context.res.json(_denied("INVALID_INPUT"))

    # In-process Policy Engine: allowlist + registered tool mapping.
    try:
        native_tool, table = evaluate_policy(agent_slug, tool_id)
    except PolicyDenied as exc:
        _audit(context, body, agent_slug, "", False, exc.code)
        return context.res.json(_denied(exc.code))

    # Invoke the native tool through the self-hosted MCP server.
    args = dict(body.get("input") or {})
    args["database_id"] = "main"
    args["table_id"] = table
    try:
        result = await call_tool(native_tool, args)
    except Exception as exc:
        _audit(context, body, agent_slug, native_tool, False, "MCP_TOOL_FAILURE")
        return context.res.json(_denied("MCP_TOOL_FAILURE"))

    _audit(context, body, agent_slug, native_tool, True, None)

    return context.res.json({
        "status": "SUCCESS",
        "request_id": body.get("request_id"),
        "trace_id": body.get("trace_id"),
        "policy_decision_id": body.get("request_id", "") + "-decision",
        "storygalore_tool_id": tool_id,
        "result_schema_version": "1",
        "result": result,
    })


def _parse_body(context):
    raw = getattr(context.req, "body", None)
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (str, bytes)):
        try:
            return json.loads(raw) if raw else {}
        except Exception:
            return {}
    return {}


def _audit(context, body, agent_slug, native_tool, allowed, error_code):
    decision = "ALLOW" if allowed else "DENY"
    payload = {
        "eventType": "central_agent_gateway.decision.v1",
        "agentSlug": agent_slug,
        "toolId": body.get("storygalore_tool_id"),
        "nativeTool": native_tool,
        "capabilityId": body.get("capability_id"),
        "decision": decision,
        "correlationId": body.get("trace_id"),
    }
    if error_code:
        payload["errorCode"] = error_code
    context.log("audit: %s" % json.dumps(payload))
    _emit_domain_event(context, body, payload)


def _emit_domain_event(context, body, payload):
    """Best-effort domain event write via the Appwrite Python SDK."""
    try:
        import os
        from appwrite.client import Client
        from appwrite.services.tables_db import TablesDb

        endpoint = os.environ.get("APPWRITE_ENDPOINT") or os.environ.get("APPWRITE_FUNCTION_API_ENDPOINT", "")
        key = os.environ.get("APPWRITE_FUNCTION_API_KEY") or context.req.headers.get("x-appwrite-key", "")
        project = os.environ.get("APPWRITE_FUNCTION_PROJECT_ID", "")

        client = Client()
        client.set_endpoint(endpoint).set_project(project).set_key(key)
        row_id = str(uuid.uuid4())
        TablesDb(client).create_row(
            database_id="main",
            table_id="domain_events",
            row_id=row_id,
            data={
                "eventId": str(uuid.uuid4()),
                "eventType": "central_agent_gateway.decision.v1",
                "aggregateId": body.get("task_id"),
                "payload": json.dumps(payload),
                "correlationId": body.get("trace_id"),
                "occurredAt": datetime.now(timezone.utc).isoformat(),
                "deliveryAttempts": 0,
            },
        )
    except Exception as exc:
        context.error("audit event write failed: %s" % exc)
