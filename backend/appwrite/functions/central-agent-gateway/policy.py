"""In-process Policy Engine for the central-agent-gateway.

Deny-by-default: a tool must be allowlisted for the agent AND mapped to a
registered native tool (or domain adapter) before it is invoked.
"""

AGENT_ALLOWLIST = {
    "story-producer": {"stories.read", "stories.create_draft", "story_plans.read", "story_plans.create"},
    "story-guardian": {"stories.read", "continuity.read", "moderation.propose"},
    "art-director": {"stories.read", "art_briefs.read", "art_briefs.create_draft", "media_metadata.read"},
    "production": {"stories.read", "production_jobs.read", "production_jobs.create_approved"},
    "community-guardian": {"community_reports.read_scoped", "moderation.propose"},
    "discovery-curator": {"published_catalog.read", "recommendations.propose", "collections.create_draft"},
    "reader-companion": {"published_catalog.read", "reader_context.read_scoped"},
    "creator-business": {"creator_metrics.read_scoped", "campaigns.read_scoped", "business_reports.create"},
    "media-operations": {"media_metadata.read", "media_jobs.read", "media_jobs.retry_approved"},
    "support": {"support_cases.read_scoped", "support_cases.update_scoped", "support_escalations.create"},
    "qa-release": {"release_evidence.read", "contract_validation.run", "release_readiness.report"},
    "infrastructure": {"infrastructure_status.read", "approved_operations.read", "staging_operation.execute_approved"},
    "ceo": {"executive_reports.read_aggregated", "business_reports.read_aggregated"},
    "data-analysis-reporting": {"analytics.read_approved", "economics.read_approved", "reports.create"},
    "coding-dev": {"appwrite_docs.search", "development_resources.read", "staging_resources.mutate_approved"},
    "orchestrator": {"agent_tasks.read", "agent_tasks.create", "agent_tasks.delegate_approved"},
    "keep2share-import": {"imports.read_own", "imports.create", "imports.status.read_own", "media_upload.initiate_approved"},
}

# Stable StoryGalore tool id -> (native MCP tool, fixed table). Read tools only;
# mutation tools require domain adapters and stay fail-closed (unmapped).
TOOL_TO_NATIVE = {
    "stories.read": ("tables_db_get_row", "publications"),
    "story_plans.read": ("tables_db_get_row", "studio_story_bibles"),
    "media_metadata.read": ("tables_db_list_rows", "media_assets"),
    "community_reports.read_scoped": ("tables_db_list_rows", "reports"),
    "published_catalog.read": ("tables_db_list_rows", "publications"),
    "support_cases.read_scoped": ("tables_db_list_rows", "support_tickets"),
    "agent_tasks.read": ("tables_db_list_rows", "agent_tasks"),
}


class PolicyDenied(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def evaluate_policy(agent_slug, tool_id):
    """Return (native_tool, table) or raise PolicyDenied (fail-closed)."""
    allowed = AGENT_ALLOWLIST.get(agent_slug)
    if allowed is None:
        raise PolicyDenied("UNKNOWN_AGENT")
    if tool_id not in allowed:
        raise PolicyDenied("TOOL_NOT_ALLOWLISTED")
    mapping = TOOL_TO_NATIVE.get(tool_id)
    if not mapping or not mapping[0]:
        raise PolicyDenied("UNREGISTERED_TOOL_MAPPING")
    return mapping
