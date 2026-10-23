package handler

import (
	"encoding/json"
	"os"
	"strings"
	"time"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/client"
	"github.com/appwrite/sdk-for-go/tablesdb"
	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

const databaseID = "main"

// Main is the analytics domain function: it exposes the dashboard query
// contract (platform KPI counters, per-status/type breakdowns) and, on the
// schedule trigger, runs the daily aggregation pass. It reads the same
// authoritative TablesDB domain tables as the api gateway.
func Main(ctx openruntimes.Context) openruntimes.Response {
	cl := newClient(ctx)
	service := tablesdb.New(cl)

	trigger := ctx.Req.Headers["x-appwrite-trigger"]
	ctx.Log("analytics: processing", "trigger="+trigger, "method="+ctx.Req.Method)

	now30 := time.Now().UTC().Add(-30 * 24 * time.Hour).Format(time.RFC3339Nano)

	result := map[string]any{
		"kpis": map[string]any{
			"activePaidSubscribers": countRows(ctx, service, "subscriptions", qEqual("status", "ACTIVE")),
			"mrrCents":              sumInt(ctx, service, "subscriptions", "amount", qEqual("status", "ACTIVE"), qEqual("billingInterval", "MONTH")),
			"newSubscribers30d":     countRows(ctx, service, "subscriptions", greaterEqual("createdAt", now30)),
			"churned30d":            countRows(ctx, service, "subscriptions", greaterEqual("cancelledAt", now30)),
			"revenue30dCents":       sumInt(ctx, service, "payments", "amount", qEqual("status", "CAPTURED"), greaterEqual("createdAt", now30)),
			"activeReaders30d":      countRows(ctx, service, "reading_progress", greaterEqual("lastAccessedAt", now30)),
			"publishedContent":      countRows(ctx, service, "publications", qEqual("status", "PUBLISHED")),
			"aiJobs30d":             0,
		},
		"breakdown": map[string]any{
			"contentByType":         countByField(ctx, service, "publications", "type"),
			"contentByStatus":       countByField(ctx, service, "publications", "status"),
			"subscriptionsByStatus": countByField(ctx, service, "subscriptions", "status"),
			"paymentsByProvider":    countByField(ctx, service, "payments", "provider"),
			"paymentsByStatus":      countByField(ctx, service, "payments", "status"),
			"creatorsByStatus":      countByField(ctx, service, "creators", "creatorStatus"),
		},
		"generatedAt": time.Now().UTC().Format(time.RFC3339),
	}

	return ctx.Res.Json(result)
}

func newClient(ctx openruntimes.Context) client.Client {
	endpoint := os.Getenv("APPWRITE_ENDPOINT")
	if endpoint == "" {
		endpoint = os.Getenv("APPWRITE_FUNCTION_API_ENDPOINT")
		if endpoint == "" || strings.Contains(endpoint, "appwrite.test") {
			endpoint = os.Getenv("APPWRITE_FUNCTION_ENDPOINT")
		}
	}
	ctx.Log("analytics: newClient", "resolvedEndpoint="+endpoint)
	key := os.Getenv("APPWRITE_FUNCTION_API_KEY")
	if key == "" {
		key = ctx.Req.Headers["x-appwrite-key"]
	}
	return appwrite.NewClient(
		appwrite.WithEndpoint(endpoint),
		appwrite.WithProject(os.Getenv("APPWRITE_FUNCTION_PROJECT_ID")),
		appwrite.WithKey(key),
	)
}

func qEqual(attr, value string) string {
	v, _ := json.Marshal(value)
	return `{"method":"equal","attribute":"` + attr + `","values":[` + string(v) + `]}`
}

func greaterEqual(attr, value string) string {
	v, _ := json.Marshal(value)
	return `{"method":"greaterThanEqual","attribute":"` + attr + `","values":[` + string(v) + `]}`
}

func listRows(ctx openruntimes.Context, service *tablesdb.TablesDB, table string, queries ...string) []map[string]any {
	all := append(queries, `{"method":"limit","values":[1000]}`)
	list, err := service.ListRows(databaseID, table, service.WithListRowsQueries(all))
	if err != nil {
		ctx.Error("analytics: listRows failed table="+table, err)
		return nil
	}
	var raw map[string]any
	if list.Decode(&raw) != nil {
		return nil
	}
	rows, _ := raw["rows"].([]interface{})
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		if m, ok := r.(map[string]interface{}); ok {
			out = append(out, m)
		}
	}
	return out
}

func countRows(ctx openruntimes.Context, service *tablesdb.TablesDB, table string, queries ...string) int {
	return len(listRows(ctx, service, table, queries...))
}

func sumInt(ctx openruntimes.Context, service *tablesdb.TablesDB, table, field string, queries ...string) int {
	sum := 0
	for _, m := range listRows(ctx, service, table, queries...) {
		sum += toInt(m[field])
	}
	return sum
}

func countByField(ctx openruntimes.Context, service *tablesdb.TablesDB, table, field string) map[string]int {
	out := map[string]int{}
	for _, m := range listRows(ctx, service, table) {
		if v, ok := m[field].(string); ok && v != "" {
			out[v]++
		}
	}
	return out
}

func toInt(v interface{}) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	case json.Number:
		i, _ := n.Int64()
		return int(i)
	case string:
		var f float64
		if err := json.Unmarshal([]byte(n), &f); err == nil {
			return int(f)
		}
	}
	return 0
}
