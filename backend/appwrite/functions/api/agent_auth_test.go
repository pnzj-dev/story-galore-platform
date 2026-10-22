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

	if !agentAllowedOperations["agentsupport"]["admin_support_ticket_update"] {
		t.Error("support agent must be allowlisted for admin_support_ticket_update")
	}
	if !agentAllowedOperations["agentsupport"]["support_ticket_get"] {
		t.Error("support agent must be allowlisted for support_ticket_get")
	}
	if agentAllowedOperations["agentstoryproducer"]["admin_analytics_get"] {
		t.Error("story-producer must NOT be allowlisted for admin_analytics_get")
	}
	if !agentAllowedOperations["agentstoryproducer"]["project_get"] {
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

// TestRowOwnedByActor verifies the direct-owner/public/comment-visibility
// policy (the pure, DB-free part of getRow authorization).
func TestRowOwnedByActor(t *testing.T) {
	cases := []struct {
		table string
		m     map[string]interface{}
		actor string
		want  bool
	}{
		{"plans", map[string]interface{}{"id": "p1"}, "u1", true}, // public
		{"studio_projects", map[string]interface{}{"creatorId": "u1"}, "u1", true},
		{"studio_projects", map[string]interface{}{"creatorId": "u2"}, "u1", false},
		{"media_assets", map[string]interface{}{"creatorId": "u1"}, "u1", true},
		{"subscriptions", map[string]interface{}{"userId": "u1"}, "u1", true},
		{"subscriptions", map[string]interface{}{"userId": "u2"}, "u1", false},
		{"payments", map[string]interface{}{"userId": "u1"}, "u1", true},
		{"comments", map[string]interface{}{"userId": "u1"}, "u1", true},
		{"comments", map[string]interface{}{"userId": "u2", "status": "VISIBLE"}, "u1", true},
		{"comments", map[string]interface{}{"userId": "u2", "status": "HIDDEN"}, "u1", false},
		{"comments", map[string]interface{}{"userId": "u2", "status": "REMOVED"}, "u1", false},
		// join-scoped tables are denied here (handled by rowAccessible's joins)
		{"studio_generation_requests", map[string]interface{}{"projectId": "pr1"}, "u1", false},
		// unknown tables are deny-by-default
		{"unknown_table", map[string]interface{}{"userId": "u1"}, "u1", false},
	}
	for _, c := range cases {
		if got := rowOwnedByActor(c.table, c.m, c.actor); got != c.want {
			t.Errorf("rowOwnedByActor(%q, %v, %q) = %v, want %v", c.table, c.m, c.actor, got, c.want)
		}
	}
}

// TestAgentTaskAllowlist verifies the orchestrator (and any agent granted
// agent.task.delegate) is allowlisted for the agent_task domain operations, and
// that no agent is allowlisted for a task operation that is not implemented.
func TestAgentTaskAllowlist(t *testing.T) {
	want := []string{"agent_task_create", "agent_task_list", "agent_task_get", "agent_task_update"}
	for _, op := range want {
		if !agentAllowedOperations["agentorchestrator"][op] {
			t.Errorf("orchestrator must be allowlisted for %s", op)
		}
		if !knownOperations[op] {
			t.Errorf("%s must be a registered gateway operation", op)
		}
	}
	// story-producer holds agent.task.delegate, so it may create + update tasks.
	if !agentAllowedOperations["agentstoryproducer"]["agent_task_create"] {
		t.Error("story-producer (agent.task.delegate) must be allowlisted for agent_task_create")
	}
	if !agentAllowedOperations["agentstoryproducer"]["agent_task_update"] {
		t.Error("story-producer (agent.task.delegate) must be allowlisted for agent_task_update")
	}
}

// TestAgentTaskTypesAndStates guards the enum allowlists against accidental
// drift from contracts/agents/task.yaml.
func TestAgentTaskTypesAndStates(t *testing.T) {
	for _, typ := range []string{"BUG_FIX", "FEATURE", "ANALYSIS", "REPORT", "CREATIVE", "OPERATIONS", "REVIEW", "SUPPORT_ESCALATION"} {
		if !agentTaskTypes[typ] {
			t.Errorf("expected task type %q to be valid", typ)
		}
	}
	if agentTaskTypes["BOGUS"] {
		t.Error("unknown task type must be rejected")
	}
	for _, st := range []string{"CREATED", "AUTHORIZED", "QUEUED", "RUNNING", "WAITING_APPROVAL", "WAITING_DEPENDENCY", "SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED"} {
		if !agentTaskStates[st] {
			t.Errorf("expected task state %q to be valid", st)
		}
	}
	if agentTaskStates["BOGUS"] {
		t.Error("unknown task state must be rejected")
	}
}

// TestMergeAgentTaskLists verifies the scoped list de-duplicates rows by $id
// (an agent that both requested and owns a task sees it once).
func TestMergeAgentTaskLists(t *testing.T) {
	a := []map[string]interface{}{{"$id": "t1"}, {"$id": "t2"}}
	b := []map[string]interface{}{{"$id": "t2"}, {"$id": "t3"}}
	merged := mergeAgentTaskLists(a, b)
	ids := map[string]int{}
	for _, m := range merged {
		ids[m["$id"].(string)]++
	}
	if len(merged) != 3 {
		t.Errorf("expected 3 unique tasks, got %d", len(merged))
	}
	for id, n := range ids {
		if n != 1 {
			t.Errorf("task %q appeared %d times, want 1", id, n)
		}
	}
}
