package handler

import (
	"strings"
	"testing"
)

// TestAgentAllowlistEnforcesScope verifies the generated per-agent operation
// allowlist stays within safe bounds:
//   - every allowlisted operation is a real gateway operation;
//   - no agent is allowlisted for an admin operation except the support agent's
//     `admin_support_ticket_update`;
//   - the support and story-producer scopes are correct.
func TestAgentAllowlistEnforcesScope(t *testing.T) {
	for slug, ops := range agentAllowedOperations {
		for op := range ops {
			if !knownOperations[op] {
				t.Errorf("agent %q allowlisted for unknown operation %q", slug, op)
			}
			if strings.HasPrefix(op, "admin_") && op != "admin_support_ticket_update" {
				t.Errorf("agent %q allowlisted for admin operation %q", slug, op)
			}
		}
	}

	if !agentAllowedOperations["support"]["admin_support_ticket_update"] {
		t.Error("support agent must be allowlisted for admin_support_ticket_update")
	}
	if !agentAllowedOperations["support"]["support_ticket_get"] {
		t.Error("support agent must be allowlisted for support_ticket_get")
	}
	if agentAllowedOperations["story-producer"]["admin_analytics_get"] {
		t.Error("story-producer must NOT be allowlisted for admin_analytics_get")
	}
	if !agentAllowedOperations["story-producer"]["project_get"] {
		t.Error("story-producer must be allowlisted for project_get")
	}
}

// TestAgentAllowlistNonEmpty guards against the allowlist being emptied by a
// generator or contract regression.
func TestAgentAllowlistNonEmpty(t *testing.T) {
	if len(agentAllowedOperations) < 5 {
		t.Errorf("expected allowlist to cover many agents, got %d", len(agentAllowedOperations))
	}
}

// TestResolveActorPreferSessionUser verifies the authoritative-actor rule: the
// server-set session user id (x-appwrite-user-id) always wins over the body
// claim, closing the actor-impersonation gap for session-based invocations.
func TestResolveActorPreferSessionUser(t *testing.T) {
	admin := "admin-service-account"
	agent := "agent-story-producer"

	if got := resolveActor(agent, &admin); got != agent {
		t.Errorf("resolveActor should prefer the session user, got %q want %q", got, agent)
	}
	if got := resolveActor("", &admin); got != admin {
		t.Errorf("resolveActor should fall back to the body claim, got %q want %q", got, admin)
	}
	if got := resolveActor("", nil); got != "" {
		t.Errorf("resolveActor with no user and no body should be empty, got %q", got)
	}
}
