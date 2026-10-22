package handler

import "testing"

func TestEvaluatePolicyDeniesUnknownAgent(t *testing.T) {
	if _, err := evaluatePolicy("not-an-agent", "stories.read"); err == nil {
		t.Fatal("expected denial for unknown agent")
	} else if err.Error() != "UNKNOWN_AGENT" {
		t.Fatalf("expected UNKNOWN_AGENT, got %q", err.Error())
	}
}

func TestEvaluatePolicyDeniesNonAllowlistedTool(t *testing.T) {
	if _, err := evaluatePolicy("story-producer", "support_cases.read_scoped"); err == nil {
		t.Fatal("expected denial for non-allowlisted tool")
	} else if err.Error() != "TOOL_NOT_ALLOWLISTED" {
		t.Fatalf("expected TOOL_NOT_ALLOWLISTED, got %q", err.Error())
	}
}

// An allowlisted tool with no registered native mapping still fails closed.
func TestEvaluatePolicyFailsClosedOnUnregisteredMapping(t *testing.T) {
	if _, err := evaluatePolicy("story-producer", "stories.read"); err == nil {
		t.Fatal("expected fail-closed for unregistered mapping")
	} else if err.Error() != "UNREGISTERED_TOOL_MAPPING" {
		t.Fatalf("expected UNREGISTERED_TOOL_MAPPING, got %q", err.Error())
	}
}

func TestAgentAllowlistCoversAllAgents(t *testing.T) {
	expected := []string{
		"story-producer", "story-guardian", "art-director", "production",
		"community-guardian", "discovery-curator", "reader-companion",
		"creator-business", "media-operations", "support", "qa-release",
		"infrastructure", "ceo", "data-analysis-reporting", "coding-dev",
		"orchestrator", "keep2share-import",
	}
	if len(agentAllowlist) != len(expected) {
		t.Fatalf("expected %d agents, got %d", len(expected), len(agentAllowlist))
	}
	for _, id := range expected {
		if _, ok := agentAllowlist[id]; !ok {
			t.Fatalf("missing allowlist for %s", id)
		}
	}
}
