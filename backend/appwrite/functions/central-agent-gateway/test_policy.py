import pytest

from policy import AGENT_ALLOWLIST, PolicyDenied, evaluate_policy


def test_denies_unknown_agent():
    with pytest.raises(PolicyDenied) as exc:
        evaluate_policy("not-an-agent", "stories.read")
    assert exc.value.code == "UNKNOWN_AGENT"


def test_denies_non_allowlisted_tool():
    with pytest.raises(PolicyDenied) as exc:
        evaluate_policy("story-producer", "support_cases.read_scoped")
    assert exc.value.code == "TOOL_NOT_ALLOWLISTED"


def test_fails_closed_on_unregistered_mapping():
    with pytest.raises(PolicyDenied) as exc:
        evaluate_policy("story-producer", "stories.create_draft")
    assert exc.value.code == "UNREGISTERED_TOOL_MAPPING"


def test_resolves_mapping():
    native, table = evaluate_policy("story-producer", "stories.read")
    assert native == "tables_db_get_row"
    assert table == "publications"


def test_allowlist_covers_all_agents():
    expected = [
        "story-producer", "story-guardian", "art-director", "production",
        "community-guardian", "discovery-curator", "reader-companion",
        "creator-business", "media-operations", "support", "qa-release",
        "infrastructure", "ceo", "data-analysis-reporting", "coding-dev",
        "orchestrator", "keep2share-import",
    ]
    assert len(AGENT_ALLOWLIST) == len(expected)
    for agent_id in expected:
        assert agent_id in AGENT_ALLOWLIST
