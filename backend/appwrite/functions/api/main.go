package handler

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/client"
	"github.com/appwrite/sdk-for-go/functions"
	"github.com/appwrite/sdk-for-go/tablesdb"
	"github.com/appwrite/sdk-for-go/tokens"
	"github.com/appwrite/sdk-for-go/users"
	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

type GatewayInput struct {
	RequestId      string         `json:"requestId"`
	CorrelationId  string         `json:"correlationId"`
	ActorId        *string        `json:"actorId"`
	OperationId    *string        `json:"operationId"`
	IdempotencyKey *string        `json:"idempotencyKey"`
	Payload        GatewayPayload `json:"payload"`
}

type GatewayPayload struct {
	Operation string          `json:"operation"`
	Input     json.RawMessage `json:"input"`
}

type GatewayOutput struct {
	Status      string  `json:"status"`
	OperationId *string `json:"operationId"`
	Result      any     `json:"result"`
	ErrorCode   *string `json:"errorCode"`
	Retryable   bool    `json:"retryable"`
}

var knownOperations = map[string]bool{
	"studio_project_create": true, "studio_project_update": true,
	"page_create": true, "page_reorder": true, "panel_create": true,
	"page_delete": true, "panel_delete": true, "panel_update": true,
	"editor_apply_operation": true, "draft_revision_restore": true,
	"generation_create": true, "generation_apply_to_draft": true,
	"publication_validate": true, "publication_publish": true,
	"project_get": true, "project_list": true, "story_bible_get": true,
	"story_bible_upsert": true, "character_list": true, "character_create": true,
	"world_get": true, "world_upsert": true, "asset_list": true,
	"studio_publication_list": true,
	"document_get":            true, "document_update": true, "page_get": true, "revision_list": true,
	"document_revision_list": true,
	"operation_list":         true, "generation_get": true,
	"publication_validation_get": true,
	"comment_create":             true, "comment_edit": true, "comment_delete": true,
	"comment_reply": true, "comment_react": true, "comment_report": true,
	"comment_moderate": true, "comment_list": true, "comment_get": true,
	"subscription_create": true, "subscription_cancel": true, "subscription_pause": true,
	"subscription_resume": true, "subscription_change_plan": true, "subscription_renew": true,
	"subscription_reconcile": true, "plan_get": true, "plan_list": true, "subscription_get": true, "subscription_list": true,
	"payment_create": true, "payment_confirm_from_webhook": true, "payment_refund": true,
	"payment_reconcile": true, "payment_mark_failed": true, "payment_get": true, "payment_list": true,
	"reading_progress_upsert": true, "reading_progress_complete": true,
	"reading_progress_get": true, "continue_list": true,
	"publication_list": true, "publication_get": true, "creator_list": true, "creator_get": true,
	"support_ticket_create": true, "support_ticket_list": true, "support_ticket_get": true,
	"creator_create": true, "creator_update": true,
	"reader_manifest_get": true,
	"document_create":     true, "document_list": true,
	"media_upload_initiate": true, "media_upload_complete": true,
	"media_asset_list": true, "media_asset_get": true,
	"media_delivery_authorize": true,
	"page_update":              true,
	"ad_eligible_creative_get": true, "ad_campaign_create": true, "ad_campaign_list": true,
	"ad_creative_create":     true,
	"ad_campaign_set_status": true, "ad_placement_list": true, "ad_placement_create": true,
	"ad_event_ingest":        true,
	"admin_overview_get":     true,
	"admin_users_list":       true,
	"admin_publication_list": true, "admin_payment_list": true, "admin_subscription_list": true,
	"admin_creator_list": true, "admin_comment_list": true,
	"admin_destructive_request": true, "admin_destructive_approve": true,
	"admin_destructive_execute": true, "admin_destructive_list": true,
	"admin_user_get": true, "admin_publication_get": true, "admin_creator_get": true,
	"admin_support_ticket_list": true, "admin_support_ticket_get": true, "admin_support_ticket_update": true,
	"admin_analytics_get":         true,
	"admin_analytics_events_list": true,
	"admin_analytics_aggregate":   true, "admin_analytics_daily_get": true,
	"admin_analytics_retention_get": true, "admin_analytics_funnel_get": true,
	"admin_analytics_acquisition_get": true, "admin_analytics_cohorts_get": true,
	"prompt_template_list": true, "prompt_template_create": true,
	"generation_list": true, "creator_analytics_get": true,
	"generation_cancel": true, "generation_fail": true,
	"generation_process": true, "generation_list_pending": true,
	"generation_complete":   true,
	"prompt_redact_expired": true,
	"ai_provider_list":      true, "ai_provider_get": true,
	"ai_provider_create": true, "ai_provider_update": true,
	"ai_model_list": true, "ai_model_get": true,
	"ai_model_create": true, "ai_model_update": true,
	"admin_operations_get": true, "admin_security_get": true,
	"incident_create": true, "incident_list": true, "incident_update": true,
	"admin_plan_profitability": true,
	"alert_create":             true, "alert_list": true, "alert_update": true,
	"alert_evaluate": true,
	"admin_ai_cost":  true,
	"metric_ingest":  true,
}

const databaseID = "main"

func Main(ctx openruntimes.Context) openruntimes.Response {
	ctx.Log("api gateway request", "path="+ctx.Req.Path, "method="+ctx.Req.Method)

	// Raw Stripe webhook endpoint (received directly from Stripe).
	if ctx.Req.Path == "/webhooks/stripe" {
		return handleStripeWebhook(ctx, newClient(ctx))
	}

	// Scheduled trigger (cron; trusted, no actor). Runs alert evaluation and
	// triggers the durable Cloudflare Workflows that sweep for work.
	if ctx.Req.Headers["x-appwrite-trigger"] == "schedule" {
		cl := newClient(ctx)
		results, err := evaluateAlertsCore(cl)
		if err != nil {
			ctx.Error("api: scheduled alert evaluation failed", err)
			return respond(ctx, nil, "INTERNAL_FAILURE", true)
		}
		ctx.Log("api: scheduled alert evaluation", "alerts="+fmt.Sprint(len(results)))
		triggerCloudflareWorkflows(ctx)
		return ctx.Res.Json(GatewayOutput{Status: "SUCCESS", Result: map[string]interface{}{"items": results}})
	}

	var in GatewayInput
	if err := ctx.Req.BodyJson(&in); err != nil {
		ctx.Error("api: invalid input JSON", err)
		return respond(ctx, nil, "INVALID_INPUT", false)
	}
	if in.RequestId == "" || in.CorrelationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	op := in.Payload.Operation
	if op == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	ctx.Log("api: dispatch", "operation="+op, "correlationId="+in.CorrelationId)

	if !knownOperations[op] {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}

	cl := newClient(ctx)
	switch op {
	case "studio_project_create":
		return createProject(ctx, &in, cl)
	case "studio_project_update":
		return updateProject(ctx, &in, cl)
	case "page_create":
		return createPage(ctx, &in, cl)
	case "page_reorder":
		return movePage(ctx, &in, cl)
	case "panel_create":
		return createPanel(ctx, &in, cl)
	case "page_delete":
		return pageDelete(ctx, &in, cl)
	case "panel_delete":
		return panelDelete(ctx, &in, cl)
	case "panel_update":
		return updatePanel(ctx, &in, cl)
	case "editor_apply_operation":
		return applyEditorOperation(ctx, &in, cl)
	case "draft_revision_restore":
		return restoreRevision(ctx, &in, cl)
	case "generation_create":
		return requestGeneration(ctx, &in, cl)
	case "generation_apply_to_draft":
		return applyGeneration(ctx, &in, cl)
	case "prompt_template_list":
		return promptTemplateList(ctx, &in, cl)
	case "prompt_template_create":
		return promptTemplateCreate(ctx, &in, cl)
	case "generation_list":
		return generationList(ctx, &in, cl)
	case "generation_cancel":
		return generationCancel(ctx, &in, cl)
	case "generation_fail":
		return generationFail(ctx, &in, cl)
	case "generation_complete":
		return generationComplete(ctx, &in, cl)
	case "generation_process":
		return generationProcess(ctx, &in, cl)
	case "generation_list_pending":
		return generationListPending(ctx, &in, cl)
	case "prompt_redact_expired":
		return promptRedactExpired(ctx, &in, cl)
	case "ai_provider_list":
		return aiProviderList(ctx, &in, cl)
	case "ai_provider_get":
		return aiProviderGet(ctx, &in, cl)
	case "ai_provider_create":
		return aiProviderCreate(ctx, &in, cl)
	case "ai_provider_update":
		return aiProviderUpdate(ctx, &in, cl)
	case "ai_model_list":
		return aiModelList(ctx, &in, cl)
	case "ai_model_get":
		return aiModelGet(ctx, &in, cl)
	case "ai_model_create":
		return aiModelCreate(ctx, &in, cl)
	case "ai_model_update":
		return aiModelUpdate(ctx, &in, cl)
	case "admin_operations_get":
		return adminOperationsGet(ctx, &in, cl)
	case "admin_security_get":
		return adminSecurityGet(ctx, &in, cl)
	case "incident_create":
		return incidentCreate(ctx, &in, cl)
	case "incident_list":
		return incidentList(ctx, &in, cl)
	case "incident_update":
		return incidentUpdate(ctx, &in, cl)
	case "admin_plan_profitability":
		return adminPlanProfitability(ctx, &in, cl)
	case "alert_create":
		return alertCreate(ctx, &in, cl)
	case "alert_list":
		return alertList(ctx, &in, cl)
	case "alert_update":
		return alertUpdate(ctx, &in, cl)
	case "alert_evaluate":
		return alertEvaluate(ctx, &in, cl)
	case "admin_ai_cost":
		return adminAiCost(ctx, &in, cl)
	case "metric_ingest":
		return metricIngest(ctx, &in, cl)
	case "creator_analytics_get":
		return creatorAnalyticsGet(ctx, &in, cl)
	case "publication_validate":
		return validatePublication(ctx, &in, cl)
	case "publication_publish":
		return publish(ctx, &in, cl)
	case "project_get":
		return getRow(ctx, &in, cl, "studio_projects")
	case "project_list":
		return projectList(ctx, &in, cl)
	case "story_bible_get":
		return storyBibleGet(ctx, &in, cl)
	case "story_bible_upsert":
		return storyBibleUpsert(ctx, &in, cl)
	case "character_list":
		return characterList(ctx, &in, cl)
	case "character_create":
		return characterCreate(ctx, &in, cl)
	case "world_get":
		return worldGet(ctx, &in, cl)
	case "world_upsert":
		return worldUpsert(ctx, &in, cl)
	case "asset_list":
		return assetList(ctx, &in, cl)
	case "studio_publication_list":
		return studioPublicationList(ctx, &in, cl)
	case "document_get":
		return documentGet(ctx, &in, cl)
	case "document_update":
		return documentUpdate(ctx, &in, cl)
	case "page_get":
		return getRow(ctx, &in, cl, "studio_pages")
	case "revision_list":
		return listRows(ctx, &in, cl, "studio_editor_revisions")
	case "document_revision_list":
		return documentRevisionList(ctx, &in, cl)
	case "operation_list":
		return listRows(ctx, &in, cl, "studio_editor_operations")
	case "generation_get":
		return getRow(ctx, &in, cl, "studio_generation_requests")
	case "publication_validation_get":
		return getRow(ctx, &in, cl, "studio_publication_validation_runs")
	case "comment_create":
		return commentCreate(ctx, &in, cl)
	case "comment_edit":
		return commentEdit(ctx, &in, cl)
	case "comment_delete":
		return commentDelete(ctx, &in, cl)
	case "comment_reply":
		return commentReply(ctx, &in, cl)
	case "comment_react":
		return commentReact(ctx, &in, cl)
	case "comment_report":
		return commentReport(ctx, &in, cl)
	case "comment_moderate":
		return commentModerate(ctx, &in, cl)
	case "comment_list":
		return listRows(ctx, &in, cl, "comments")
	case "comment_get":
		return getRow(ctx, &in, cl, "comments")
	case "subscription_create":
		return subscriptionCreate(ctx, &in, cl)
	case "subscription_cancel":
		return subscriptionCancel(ctx, &in, cl)
	case "subscription_pause":
		return subscriptionPause(ctx, &in, cl)
	case "subscription_resume":
		return subscriptionResume(ctx, &in, cl)
	case "subscription_change_plan":
		return subscriptionChangePlan(ctx, &in, cl)
	case "subscription_renew":
		return subscriptionRenew(ctx, &in, cl)
	case "subscription_reconcile":
		return subscriptionReconcile(ctx, &in, cl)
	case "plan_get":
		return getRow(ctx, &in, cl, "plans")
	case "plan_list":
		return listRows(ctx, &in, cl, "plans")
	case "subscription_get":
		return getRow(ctx, &in, cl, "subscriptions")
	case "subscription_list":
		return subscriptionList(ctx, &in, cl)
	case "payment_create":
		return paymentCreate(ctx, &in, cl)
	case "payment_confirm_from_webhook":
		return paymentConfirmFromWebhook(ctx, &in, cl)
	case "payment_refund":
		return paymentRefund(ctx, &in, cl)
	case "payment_reconcile":
		return paymentReconcile(ctx, &in, cl)
	case "payment_mark_failed":
		return paymentMarkFailed(ctx, &in, cl)
	case "payment_get":
		return getRow(ctx, &in, cl, "payments")
	case "payment_list":
		return listRows(ctx, &in, cl, "payments")
	case "reading_progress_upsert":
		return readingProgressUpsert(ctx, &in, cl)
	case "reading_progress_complete":
		return readingProgressComplete(ctx, &in, cl)
	case "reading_progress_get":
		return readingProgressGet(ctx, &in, cl)
	case "continue_list":
		return continueList(ctx, &in, cl)
	case "publication_list":
		return publicationList(ctx, &in, cl)
	case "publication_get":
		return publicationGet(ctx, &in, cl)
	case "support_ticket_create":
		return supportTicketCreate(ctx, &in, cl)
	case "support_ticket_list":
		return supportTicketList(ctx, &in, cl)
	case "support_ticket_get":
		return supportTicketGet(ctx, &in, cl)
	case "creator_list":
		return creatorList(ctx, &in, cl)
	case "creator_get":
		return creatorGet(ctx, &in, cl)
	case "creator_create":
		return creatorCreate(ctx, &in, cl)
	case "creator_update":
		return creatorUpdate(ctx, &in, cl)
	case "reader_manifest_get":
		return readerManifestGet(ctx, &in, cl)
	case "document_create":
		return documentCreate(ctx, &in, cl)
	case "document_list":
		return documentList(ctx, &in, cl)
	case "media_upload_initiate":
		return mediaUploadInitiate(ctx, &in, cl)
	case "media_upload_complete":
		return mediaUploadComplete(ctx, &in, cl)
	case "media_asset_list":
		return mediaAssetList(ctx, &in, cl)
	case "media_asset_get":
		return getRow(ctx, &in, cl, "media_assets")
	case "media_delivery_authorize":
		return mediaDeliveryAuthorize(ctx, &in, cl)
	case "page_update":
		return updatePage(ctx, &in, cl)
	case "ad_eligible_creative_get":
		return adEligibleCreativeGet(ctx, &in, cl)
	case "ad_campaign_create":
		return adCampaignCreate(ctx, &in, cl)
	case "ad_creative_create":
		return adCreativeCreate(ctx, &in, cl)
	case "ad_campaign_list":
		return adCampaignList(ctx, &in, cl)
	case "ad_campaign_set_status":
		return adCampaignSetStatus(ctx, &in, cl)
	case "ad_placement_list":
		return adPlacementList(ctx, &in, cl)
	case "ad_placement_create":
		return adPlacementCreate(ctx, &in, cl)
	case "ad_event_ingest":
		return adEventIngest(ctx, &in, cl)
	case "admin_overview_get":
		return adminOverviewGet(ctx, &in, cl)
	case "admin_users_list":
		return adminUsersList(ctx, &in, cl)
	case "admin_publication_list":
		return adminListRows(ctx, &in, cl, "publications")
	case "admin_payment_list":
		return adminListRows(ctx, &in, cl, "payments")
	case "admin_subscription_list":
		return adminListRows(ctx, &in, cl, "subscriptions")
	case "admin_creator_list":
		return adminListRows(ctx, &in, cl, "creators")
	case "admin_comment_list":
		return adminListRows(ctx, &in, cl, "comments")
	case "admin_destructive_request":
		return adminDestructiveRequest(ctx, &in, cl)
	case "admin_destructive_approve":
		return adminDestructiveApprove(ctx, &in, cl)
	case "admin_destructive_execute":
		return adminDestructiveExecute(ctx, &in, cl)
	case "admin_destructive_list":
		return adminDestructiveList(ctx, &in, cl)
	case "admin_user_get":
		return adminUserGet(ctx, &in, cl)
	case "admin_publication_get":
		return adminPublicationGet(ctx, &in, cl)
	case "admin_creator_get":
		return adminCreatorGet(ctx, &in, cl)
	case "admin_support_ticket_list":
		return adminSupportTicketList(ctx, &in, cl)
	case "admin_support_ticket_get":
		return adminSupportTicketGet(ctx, &in, cl)
	case "admin_support_ticket_update":
		return adminSupportTicketUpdate(ctx, &in, cl)
	case "admin_analytics_get":
		return adminAnalyticsGet(ctx, &in, cl)
	case "admin_analytics_events_list":
		return adminAnalyticsEventsList(ctx, &in, cl)
	case "admin_analytics_aggregate":
		return adminAnalyticsAggregate(ctx, &in, cl)
	case "admin_analytics_daily_get":
		return adminAnalyticsDailyGet(ctx, &in, cl)
	case "admin_analytics_retention_get":
		return adminAnalyticsRetentionGet(ctx, &in, cl)
	case "admin_analytics_funnel_get":
		return adminAnalyticsFunnelGet(ctx, &in, cl)
	case "admin_analytics_acquisition_get":
		return adminAnalyticsAcquisitionGet(ctx, &in, cl)
	case "admin_analytics_cohorts_get":
		return adminAnalyticsCohortsGet(ctx, &in, cl)
	default:
		return respond(ctx, in.OperationId, op+"_NOT_IMPLEMENTED", false)
	}
}

func projectList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	creatorId := actorOrEmpty(in.ActorId)
	if creatorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_projects", service.WithListRowsQueries([]string{
		qEqual("creatorId", creatorId),
		`{"method":"orderDesc","attribute":"updatedAt"}`,
		`{"method":"limit","values":[50]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

// projectOwnedByActor reports whether the actor is the creator of the project.
func projectOwnedByActor(cl client.Client, projectId, actorId string) bool {
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "studio_projects", projectId)
	if err != nil {
		return false
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return false
	}
	creatorId, _ := m["creatorId"].(string)
	return creatorId == actorId
}

func storyBibleGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_story_bibles", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return success(ctx, in, map[string]interface{}{})
	}
	return success(ctx, in, rows[0])
}

func storyBibleUpsert(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
		Premise   string `json:"premise"`
		Themes    string `json:"themes"`
		Tone      string `json:"tone"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_story_bibles", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	nowStr := now()
	data := map[string]interface{}{
		"premise":   input.Premise,
		"themes":    input.Themes,
		"tone":      input.Tone,
		"updatedAt": nowStr,
	}
	if len(rows) == 0 {
		data["projectId"] = input.ProjectId
		if err := createRow(cl, "studio_story_bibles", newUUID(), data); err != nil {
			return internalFailure(ctx, in, err)
		}
	} else {
		row, _ := rows[0].(map[string]interface{})
		rowId, _ := row["$id"].(string)
		if err := updateRow(cl, "studio_story_bibles", rowId, data); err != nil {
			return internalFailure(ctx, in, err)
		}
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

func characterList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_characters", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"orderAsc","attribute":"name"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func characterCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId   string `json:"projectId"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" || input.Name == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	rowId := newUUID()
	if err := createRow(cl, "studio_characters", rowId, map[string]interface{}{
		"id":          rowId,
		"projectId":   input.ProjectId,
		"name":        input.Name,
		"description": input.Description,
		"status":      "ACTIVE",
		"revision":    1,
	}); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true, "characterId": rowId})
}

func worldGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_worlds", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return success(ctx, in, map[string]interface{}{})
	}
	return success(ctx, in, rows[0])
}

func worldUpsert(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId   string `json:"projectId"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Locations   string `json:"locations"`
		Rules       string `json:"rules"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_worlds", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	data := map[string]interface{}{
		"name":        input.Name,
		"description": input.Description,
		"locations":   input.Locations,
		"rules":       input.Rules,
	}
	if len(rows) == 0 {
		rowId := newUUID()
		data["id"] = rowId
		data["projectId"] = input.ProjectId
		data["revision"] = 1
		if err := createRow(cl, "studio_worlds", rowId, data); err != nil {
			return internalFailure(ctx, in, err)
		}
	} else {
		row, _ := rows[0].(map[string]interface{})
		rowId, _ := row["$id"].(string)
		if err := updateRow(cl, "studio_worlds", rowId, data); err != nil {
			return internalFailure(ctx, in, err)
		}
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

func assetList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_assets", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func studioPublicationList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "publications", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"orderDesc","attribute":"updatedAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

// subscriptionList returns the authenticated user's subscriptions (scoped to
// the actor's userId).
func subscriptionList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	userId := actorOrEmpty(in.ActorId)
	if userId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "subscriptions", service.WithListRowsQueries([]string{
		qEqual("userId", userId),
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[50]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func documentCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ProjectId string  `json:"projectId"`
		Type      string  `json:"type"`
		Title     string  `json:"title"`
		Format    *string `json:"format"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" || input.Type == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	proj, err := service.GetRow(databaseID, "studio_projects", input.ProjectId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var pm map[string]interface{}
	if proj.Decode(&pm) != nil || pm["creatorId"] != actorId {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	documentId := idOrUUID(in.IdempotencyKey)
	row := map[string]interface{}{
		"id": documentId, "projectId": input.ProjectId, "type": input.Type,
		"draftId": newUUID(), "revisionId": newUUID(),
	}
	if input.Title != "" {
		row["title"] = input.Title
	}
	if input.Format != nil && *input.Format != "" {
		row["format"] = *input.Format
	}
	if err := createRow(cl, "studio_documents", documentId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.document.created.v1", documentId, actorOrEmpty(in.ActorId), map[string]interface{}{"documentId": documentId, "projectId": input.ProjectId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"documentId": documentId})
}

func documentList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	proj, err := service.GetRow(databaseID, "studio_projects", input.ProjectId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var pm map[string]interface{}
	if proj.Decode(&pm) != nil || pm["creatorId"] != actorId {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	list, err := service.ListRows(databaseID, "studio_documents", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"limit","values":[100]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

// documentOwnedByActor verifies the actor owns the project containing the document.
func documentOwnedByActor(cl client.Client, documentId, actorId string) bool {
	if documentId == "" || actorId == "" {
		return false
	}
	service := tablesdb.New(cl)
	doc, err := service.GetRow(databaseID, "studio_documents", documentId)
	if err != nil {
		return false
	}
	var dm map[string]interface{}
	if doc.Decode(&dm) != nil {
		return false
	}
	projectId, _ := dm["projectId"].(string)
	if projectId == "" {
		return false
	}
	proj, err := service.GetRow(databaseID, "studio_projects", projectId)
	if err != nil {
		return false
	}
	var pm map[string]interface{}
	if proj.Decode(&pm) != nil {
		return false
	}
	return pm["creatorId"] == actorId
}

// pageDocumentId resolves the documentId a page belongs to.
func pageDocumentId(cl client.Client, pageId string) string {
	if pageId == "" {
		return ""
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "studio_pages", pageId)
	if err != nil {
		return ""
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return ""
	}
	did, _ := m["documentId"].(string)
	return did
}

// panelDocumentId resolves the documentId a panel belongs to (via its page).
func panelDocumentId(cl client.Client, panelId string) string {
	if panelId == "" {
		return ""
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "studio_panels", panelId)
	if err != nil {
		return ""
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return ""
	}
	pid, _ := m["pageId"].(string)
	return pageDocumentId(cl, pid)
}

func documentGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		DocumentId string `json:"documentId"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	documentId := input.DocumentId
	if documentId == "" {
		documentId = firstID(in.Payload.Input)
	}
	if documentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, documentId, actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	doc, err := service.GetRow(databaseID, "studio_documents", documentId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var docRaw map[string]interface{}
	if err := doc.Decode(&docRaw); err != nil {
		return internalFailure(ctx, in, err)
	}
	pagesList, err := service.ListRows(databaseID, "studio_pages", service.WithListRowsQueries([]string{
		qEqual("documentId", documentId),
		`{"method":"orderAsc","attribute":"position"}`,
		`{"method":"limit","values":[1000]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var pagesRaw map[string]interface{}
	if err := pagesList.Decode(&pagesRaw); err != nil {
		return internalFailure(ctx, in, err)
	}
	pageRows, _ := pagesRaw["rows"].([]interface{})
	pages := make([]map[string]interface{}, 0, len(pageRows))
	for _, pr := range pageRows {
		pm, _ := pr.(map[string]interface{})
		pageId, _ := pm["$id"].(string)
		if pageId == "" {
			pageId, _ = pm["id"].(string)
		}
		var panels []interface{}
		if pageId != "" {
			panelsList, perr := service.ListRows(databaseID, "studio_panels", service.WithListRowsQueries([]string{
				qEqual("pageId", pageId),
				`{"method":"orderAsc","attribute":"position"}`,
				`{"method":"limit","values":[1000]}`,
			}))
			if perr == nil {
				var panelsRaw map[string]interface{}
				if panelsList.Decode(&panelsRaw) == nil {
					panels, _ = panelsRaw["rows"].([]interface{})
				}
			}
		}
		if panels == nil {
			panels = []interface{}{}
		}
		pm["panels"] = panels
		pages = append(pages, pm)
	}
	return success(ctx, in, map[string]interface{}{"document": docRaw, "pages": pages})
}

func documentUpdate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		DocumentId    string  `json:"documentId"`
		Title         *string `json:"title"`
		Format        *string `json:"format"`
		ReadingFormat *string `json:"readingFormat"`
	}
	if !decode(ctx, in, &input) || input.DocumentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, input.DocumentId, actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	data := map[string]interface{}{}
	if input.Title != nil {
		data["title"] = *input.Title
	}
	if input.Format != nil {
		data["format"] = *input.Format
	}
	if input.ReadingFormat != nil {
		data["readingFormat"] = *input.ReadingFormat
	}
	if len(data) == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "studio_documents", input.DocumentId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.document.updated.v1", input.DocumentId, actorOrEmpty(in.ActorId), map[string]interface{}{"documentId": input.DocumentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"documentId": input.DocumentId})
}

func pageDelete(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PageId string `json:"pageId"`
	}
	if !decode(ctx, in, &input) || input.PageId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, pageDocumentId(cl, input.PageId), actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	panelsList, err := service.ListRows(databaseID, "studio_panels", service.WithListRowsQueries([]string{
		qEqual("pageId", input.PageId),
		`{"method":"limit","values":[1000]}`,
	}))
	if err == nil {
		var raw map[string]interface{}
		if panelsList.Decode(&raw) == nil {
			if rows, ok := raw["rows"].([]interface{}); ok {
				for _, r := range rows {
					if pm, ok := r.(map[string]interface{}); ok {
						if pid, ok := pm["$id"].(string); ok && pid != "" {
							service.DeleteRow(databaseID, "studio_panels", pid)
						}
					}
				}
			}
		}
	}
	if _, err := service.DeleteRow(databaseID, "studio_pages", input.PageId); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.page.deleted.v1", input.PageId, actorOrEmpty(in.ActorId), map[string]interface{}{"pageId": input.PageId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"pageId": input.PageId})
}

func panelDelete(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PanelId string `json:"panelId"`
	}
	if !decode(ctx, in, &input) || input.PanelId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, panelDocumentId(cl, input.PanelId), actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	if _, err := service.DeleteRow(databaseID, "studio_panels", input.PanelId); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.panel.deleted.v1", input.PanelId, actorOrEmpty(in.ActorId), map[string]interface{}{"panelId": input.PanelId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"panelId": input.PanelId})
}

func mediaUploadInitiate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		MediaType         string  `json:"mediaType"`
		DeclaredMimeType  string  `json:"declaredMimeType"`
		DeclaredSizeBytes int64   `json:"declaredSizeBytes"`
		ContentRating     *string `json:"contentRating"`
	}
	if !decode(ctx, in, &input) || input.MediaType == "" || input.DeclaredMimeType == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if input.MediaType != "IMAGE" {
		return respond(ctx, in.OperationId, "FEATURE_FLAGGED", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	assetId := idOrUUID(in.IdempotencyKey)
	fileId := idOrUUID(nil)
	bucketKey := "media-originals"
	contentRating := "ALL_AGES"
	if input.ContentRating != nil && *input.ContentRating != "" {
		contentRating = *input.ContentRating
	}
	now := now()
	row := map[string]interface{}{
		"id": assetId, "creatorId": actorId, "type": "IMAGE", "status": "UPLOADING",
		"originProvider": "APPWRITE_STORAGE", "originBucketKey": bucketKey, "originFileId": fileId,
		"mimeType": input.DeclaredMimeType, "sizeBytes": input.DeclaredSizeBytes,
		"moderationStatus": "PENDING", "contentRating": contentRating,
		"createdAt": now, "updatedAt": now,
	}
	if err := createRow(cl, "media_assets", assetId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "media.upload.initiated.v1", assetId, actorOrEmpty(in.ActorId), map[string]interface{}{"mediaAssetId": assetId, "type": input.MediaType}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"mediaAssetId": assetId, "bucketKey": bucketKey, "fileId": fileId})
}

func mediaUploadComplete(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		MediaAssetId   string  `json:"mediaAssetId"`
		MimeType       string  `json:"mimeType"`
		SizeBytes      int64   `json:"sizeBytes"`
		ChecksumSha256 string  `json:"checksumSha256"`
		Width          *int    `json:"width"`
		Height         *int    `json:"height"`
		Orientation    *string `json:"orientation"`
	}
	if !decode(ctx, in, &input) || input.MediaAssetId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "media_assets", input.MediaAssetId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var am map[string]interface{}
	if row.Decode(&am) != nil || am["creatorId"] != actorId {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	data := map[string]interface{}{"status": "READY", "updatedAt": now()}
	if input.MimeType != "" {
		data["mimeType"] = input.MimeType
	}
	if input.SizeBytes > 0 {
		data["sizeBytes"] = input.SizeBytes
	}
	if input.ChecksumSha256 != "" {
		data["checksumSha256"] = input.ChecksumSha256
	}
	if input.Width != nil {
		data["width"] = *input.Width
	}
	if input.Height != nil {
		data["height"] = *input.Height
	}
	if input.Orientation != nil && *input.Orientation != "" {
		data["orientation"] = *input.Orientation
	}
	if err := updateRow(cl, "media_assets", input.MediaAssetId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "media.upload.completed.v1", input.MediaAssetId, actorOrEmpty(in.ActorId), map[string]interface{}{"mediaAssetId": input.MediaAssetId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"mediaAssetId": input.MediaAssetId})
}

func mediaAssetList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "media_assets", service.WithListRowsQueries([]string{
		qEqual("creatorId", actorId),
		qEqual("status", "READY"),
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func updatePage(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PageId            string  `json:"pageId"`
		BackgroundAssetId *string `json:"backgroundAssetId"`
		Width             *int    `json:"width"`
		Height            *int    `json:"height"`
	}
	if !decode(ctx, in, &input) || input.PageId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, pageDocumentId(cl, input.PageId), actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	data := map[string]interface{}{}
	if input.BackgroundAssetId != nil {
		data["backgroundAssetId"] = *input.BackgroundAssetId
	}
	if input.Width != nil {
		data["width"] = *input.Width
	}
	if input.Height != nil {
		data["height"] = *input.Height
	}
	if len(data) == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "studio_pages", input.PageId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.page.updated.v1", input.PageId, actorOrEmpty(in.ActorId), map[string]interface{}{"pageId": input.PageId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"pageId": input.PageId})
}

type deliveryDecision struct {
	Allowed     bool
	AccessClass string
	Reasons     []string
	URL         string
}

// ageFromDOB computes an age from an ISO date string (YYYY-MM-DD).
func ageFromDOB(dobStr string) (int, bool) {
	dob, err := time.Parse("2006-01-02", dobStr)
	if err != nil {
		return 0, false
	}
	now := time.Now()
	age := now.Year() - dob.Year()
	if now.YearDay() < dob.YearDay() {
		age--
	}
	if age < 0 {
		return 0, false
	}
	return age, true
}

// adultDeliveryAllowed checks the actor's server-stored date of birth and
// explicit adult-content opt-in. Fails closed (records a reason) when either is
// missing or the actor is underage.
func adultDeliveryAllowed(cl client.Client, actorId string, decision *deliveryDecision) bool {
	prefs, err := users.New(cl).GetPrefs(actorId)
	if err != nil {
		decision.Reasons = append(decision.Reasons, "AGE_VERIFICATION_REQUIRED")
		return false
	}
	var pm map[string]interface{}
	if prefs.Decode(&pm) != nil {
		decision.Reasons = append(decision.Reasons, "AGE_VERIFICATION_REQUIRED")
		return false
	}
	optIn, _ := pm["adultContentOptIn"].(bool)
	if !optIn {
		decision.Reasons = append(decision.Reasons, "ADULT_OPT_IN_REQUIRED")
		return false
	}
	dobStr, _ := pm["dateOfBirth"].(string)
	if age, ok := ageFromDOB(dobStr); !ok || age < 18 {
		decision.Reasons = append(decision.Reasons, "AGE_VERIFICATION_REQUIRED")
		return false
	}
	return true
}

// hasActiveSubscription reports whether the actor has an active subscription to
// the given creator. This is the V1 entitlement primitive for SUBSCRIPTION-gated
// delivery.
func hasActiveSubscription(cl client.Client, userId, creatorId string) bool {
	if userId == "" || creatorId == "" {
		return false
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "subscriptions", service.WithListRowsQueries([]string{
		qEqual("userId", userId),
		qEqual("creatorId", creatorId),
		qEqual("status", "ACTIVE"),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return false
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return false
	}
	rows, _ := raw["rows"].([]interface{})
	return len(rows) > 0
}

// entitlementSatisfied evaluates the publication's accessClass against the
// actor's entitlements (fail-closed). SUBSCRIPTION requires an active creator
// subscription; PURCHASE is not wired in V1 and fails closed.
func entitlementSatisfied(cl client.Client, actorId string, pm map[string]interface{}, decision *deliveryDecision) bool {
	accessClass, _ := pm["accessClass"].(string)
	if accessClass == "PURCHASE" {
		decision.Reasons = append(decision.Reasons, "ENTITLEMENT_REQUIRED")
		decision.AccessClass = "ENTITLEMENT_PROTECTED"
		return false
	}
	if actorId == "" {
		decision.Reasons = append(decision.Reasons, "ENTITLEMENT_REQUIRED")
		decision.AccessClass = "ENTITLEMENT_PROTECTED"
		return false
	}
	creatorId, _ := pm["creatorId"].(string)
	if !hasActiveSubscription(cl, actorId, creatorId) {
		decision.Reasons = append(decision.Reasons, "ENTITLEMENT_REQUIRED")
		decision.AccessClass = "ENTITLEMENT_PROTECTED"
		return false
	}
	decision.AccessClass = "ENTITLEMENT_PROTECTED"
	return true
}

// authorizeMediaDelivery evaluates the media-delivery policy (fail-closed) and,
// when allowed, resolves a delivery URL. It performs no database writes.
func authorizeMediaDelivery(cl client.Client, mediaId, action, actorId string, dims ...int) deliveryDecision {
	decision := deliveryDecision{Allowed: false, AccessClass: "PRIVATE", Reasons: []string{}}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "media_assets", mediaId)
	if err != nil {
		decision.Reasons = append(decision.Reasons, "MEDIA_NOT_FOUND")
		return decision
	}
	var am map[string]interface{}
	if row.Decode(&am) != nil {
		decision.Reasons = append(decision.Reasons, "MEDIA_UNREADABLE")
		return decision
	}
	if status, _ := am["status"].(string); status != "READY" {
		decision.Reasons = append(decision.Reasons, "MEDIA_NOT_READY")
		return decision
	}
	if mod, _ := am["moderationStatus"].(string); mod == "REJECTED" || mod == "RESTRICTED" || mod == "QUARANTINED" {
		decision.Reasons = append(decision.Reasons, "MODERATION_BLOCKED")
		return decision
	}
	rating, _ := am["contentRating"].(string)
	switch rating {
	case "TEEN":
		decision.AccessClass = "AGE_RESTRICTED"
		if actorId == "" {
			decision.Reasons = append(decision.Reasons, "AUTH_REQUIRED")
			return decision
		}
	case "ADULT_18_PLUS":
		decision.AccessClass = "AGE_RESTRICTED"
		if actorId == "" {
			decision.Reasons = append(decision.Reasons, "AUTH_REQUIRED")
			return decision
		}
		if !adultDeliveryAllowed(cl, actorId, &decision) {
			return decision
		}
	default:
		decision.AccessClass = "PUBLIC"
	}
	if pubId, _ := am["publicationId"].(string); pubId != "" {
		pub, err := service.GetRow(databaseID, "publications", pubId)
		if err != nil {
			decision.Reasons = append(decision.Reasons, "PUBLICATION_NOT_FOUND")
			return decision
		}
		var pm map[string]interface{}
		if pub.Decode(&pm) != nil {
			decision.Reasons = append(decision.Reasons, "PUBLICATION_UNREADABLE")
			return decision
		}
		if status, _ := pm["status"].(string); status != "PUBLISHED" && status != "APPROVED" {
			decision.Reasons = append(decision.Reasons, "PUBLICATION_NOT_AVAILABLE")
			return decision
		}
		if accessClass, _ := pm["accessClass"].(string); accessClass == "SUBSCRIPTION" || accessClass == "PURCHASE" {
			if !entitlementSatisfied(cl, actorId, pm, &decision) {
				return decision
			}
		}
	}
	bucket, _ := am["originBucketKey"].(string)
	fileId, _ := am["originFileId"].(string)
	if bucket == "" || fileId == "" {
		decision.Reasons = append(decision.Reasons, "ORIGIN_MISSING")
		return decision
	}
	if decision.AccessClass == "PUBLIC" {
		decision.URL = buildPreviewURL(bucket, fileId, dims...)
	} else {
		decision.URL = resolveDeliveryURL(cl, bucket, fileId, time.Hour, dims...)
	}
	decision.Allowed = true
	return decision
}

func mediaDeliveryAuthorize(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		MediaId string `json:"mediaId"`
		Action  string `json:"action"`
		Variant string `json:"variant"`
	}
	if !decode(ctx, in, &input) || input.MediaId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if input.Action == "" {
		input.Action = "VIEW"
	}
	if input.Action != "VIEW" && input.Action != "STREAM" && input.Action != "DOWNLOAD" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	decision := authorizeMediaDelivery(cl, input.MediaId, input.Action, actorId)
	result := "ALLOW"
	if !decision.Allowed {
		result = "DENY"
	}
	authorizationId := idOrUUID(nil)
	now := now()
	row := map[string]interface{}{
		"actorId": actorId, "mediaId": input.MediaId, "variant": input.Variant,
		"action": input.Action, "result": result, "createdAt": now,
	}
	if len(decision.Reasons) > 0 {
		row["reasons"] = mustJSON(decision.Reasons)
	}
	if decision.Allowed {
		row["expiresAt"] = time.Now().UTC().Add(24 * time.Hour).Format(time.RFC3339Nano)
	}
	if err := createRow(cl, "media_authorizations", authorizationId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	eventType := "media.delivery.allowed.v1"
	if !decision.Allowed {
		eventType = "media.delivery.denied.v1"
	}
	emit(ctx, cl, eventType, input.MediaId, actorOrEmpty(in.ActorId), map[string]interface{}{"mediaId": input.MediaId, "authorizationId": authorizationId, "result": result}, in.CorrelationId)
	out := map[string]interface{}{
		"authorizationId": authorizationId,
		"result":          result,
		"accessClass":     decision.AccessClass,
	}
	if decision.Allowed {
		out["deliveryUrl"] = decision.URL
	} else {
		out["reasons"] = decision.Reasons
	}
	return success(ctx, in, out)
}

// --- advertising helpers ---

// adminActor reports whether the actor carries the `admin` user label. This is
// an early, fail-closed authorization gate; the Policy Engine and route-level
// capability checks enforce authorization independently at each boundary.
func adminActor(ctx openruntimes.Context, in *GatewayInput, cl client.Client) bool {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return false
	}
	user, err := users.New(cl).Get(actorId)
	if err != nil {
		return false
	}
	for _, l := range user.Labels {
		if l == "admin" {
			return true
		}
	}
	return false
}

func stringSlice(v interface{}) []string {
	switch s := v.(type) {
	case []string:
		return s
	case []interface{}:
		out := make([]string, 0, len(s))
		for _, e := range s {
			if str, ok := e.(string); ok {
				out = append(out, str)
			}
		}
		return out
	}
	return nil
}

func containsString(list []string, target string) bool {
	for _, s := range list {
		if s == target {
			return true
		}
	}
	return false
}

func strTime(v interface{}) *time.Time {
	s, ok := v.(string)
	if !ok || s == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339Nano, s)
	if err != nil {
		return nil
	}
	return &t
}

func hasAdFreeSubscription(cl client.Client, userId string) bool {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "subscriptions", service.WithListRowsQueries([]string{
		qEqual("userId", userId),
		qEqual("status", "ACTIVE"),
		`{"method":"limit","values":[20]}`,
	}))
	if err != nil {
		return false
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return false
	}
	rows, _ := raw["rows"].([]interface{})
	for _, r := range rows {
		sub, _ := r.(map[string]interface{})
		planId, _ := sub["planId"].(string)
		if planId == "" {
			continue
		}
		plan, err := service.GetRow(databaseID, "plans", planId)
		if err != nil {
			continue
		}
		var pm map[string]interface{}
		if plan.Decode(&pm) == nil {
			if adFree, ok := pm["adFree"].(bool); ok && adFree {
				return true
			}
		}
	}
	return false
}

func findApprovedCreative(cl client.Client, creativeIds []string) map[string]interface{} {
	service := tablesdb.New(cl)
	for _, cid := range creativeIds {
		row, err := service.GetRow(databaseID, "ad_creatives", cid)
		if err != nil {
			continue
		}
		var m map[string]interface{}
		if row.Decode(&m) == nil && m["status"] == "APPROVED" {
			m["$id"] = cid
			return m
		}
	}
	return nil
}

// --- advertising handlers ---

func adEligibleCreativeGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PlacementKey string `json:"placementKey"`
	}
	if !decode(ctx, in, &input) || input.PlacementKey == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	// AD_FREE entitlement: an ad-free subscriber must never be served an ad.
	if actorId != "" && hasAdFreeSubscription(cl, actorId) {
		return success(ctx, in, map[string]interface{}{"eligible": false, "creative": nil, "reason": "AD_FREE"})
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ad_campaigns", service.WithListRowsQueries([]string{
		qEqual("status", "ACTIVE"),
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	nowT := time.Now()
	var best map[string]interface{}
	bestPriority := -1
	for _, r := range rows {
		camp, _ := r.(map[string]interface{})
		if !containsString(stringSlice(camp["placementIds"]), input.PlacementKey) {
			continue
		}
		if st := strTime(camp["startAt"]); st != nil && nowT.Before(*st) {
			continue
		}
		if et := strTime(camp["endAt"]); et != nil && nowT.After(*et) {
			continue
		}
		if p := toInt(camp["priority"]); p > bestPriority {
			bestPriority = p
			best = camp
		}
	}
	if best == nil {
		return success(ctx, in, map[string]interface{}{"eligible": false, "creative": nil, "reason": "NO_FILL"})
	}
	creative := findApprovedCreative(cl, stringSlice(best["creativeIds"]))
	if creative == nil {
		return success(ctx, in, map[string]interface{}{"eligible": false, "creative": nil, "reason": "NO_CREATIVE"})
	}
	if bucket, ok := creative["storageBucketKey"].(string); ok && bucket != "" {
		if fileId, ok := creative["storageFileId"].(string); ok && fileId != "" {
			creative["url"] = buildPreviewURL(bucket, fileId, 640)
		}
	}
	return success(ctx, in, map[string]interface{}{
		"eligible":   true,
		"creative":   creative,
		"campaignId": best["$id"],
	})
}

func adCreativeCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		CampaignId       string `json:"campaignId"`
		Name             string `json:"name"`
		AssetType        string `json:"assetType"`
		StorageBucketKey string `json:"storageBucketKey"`
		StorageFileId    string `json:"storageFileId"`
		Width            *int   `json:"width"`
		Height           *int   `json:"height"`
	}
	if !decode(ctx, in, &input) || input.CampaignId == "" || input.AssetType == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	creativeId := idOrUUID(in.IdempotencyKey)
	now := now()
	row := map[string]interface{}{
		"campaignId": input.CampaignId, "assetType": input.AssetType, "status": "APPROVED",
		"createdAt": now, "updatedAt": now,
	}
	if input.Name != "" {
		row["name"] = input.Name
	}
	if input.StorageBucketKey != "" {
		row["storageBucketKey"] = input.StorageBucketKey
	}
	if input.StorageFileId != "" {
		row["storageFileId"] = input.StorageFileId
	}
	if input.Width != nil {
		row["width"] = *input.Width
	}
	if input.Height != nil {
		row["height"] = *input.Height
	}
	if err := createRow(cl, "ad_creatives", creativeId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"creativeId": creativeId})
}

func adCampaignCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		Name                string   `json:"name"`
		Advertiser          string   `json:"advertiser"`
		Priority            int      `json:"priority"`
		PlacementIds        []string `json:"placementIds"`
		CreativeIds         []string `json:"creativeIds"`
		ContentRatingCompat string   `json:"contentRatingCompat"`
		BudgetCents         *int     `json:"budgetCents"`
		ImpressionCap       *int     `json:"impressionCap"`
		ClickCap            *int     `json:"clickCap"`
		StartAt             *string  `json:"startAt"`
		EndAt               *string  `json:"endAt"`
	}
	if !decode(ctx, in, &input) || input.Name == "" || len(input.PlacementIds) == 0 || len(input.CreativeIds) == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	campaignId := idOrUUID(in.IdempotencyKey)
	now := now()
	row := map[string]interface{}{
		"name": input.Name, "status": "DRAFT",
		"placementIds": input.PlacementIds, "creativeIds": input.CreativeIds,
		"createdAt": now, "updatedAt": now,
	}
	if input.Advertiser != "" {
		row["advertiser"] = input.Advertiser
	}
	if input.Priority != 0 {
		row["priority"] = input.Priority
	}
	if input.ContentRatingCompat != "" {
		row["contentRatingCompat"] = input.ContentRatingCompat
	}
	if input.BudgetCents != nil {
		row["budgetCents"] = *input.BudgetCents
	}
	if input.ImpressionCap != nil {
		row["impressionCap"] = *input.ImpressionCap
	}
	if input.ClickCap != nil {
		row["clickCap"] = *input.ClickCap
	}
	if input.StartAt != nil {
		row["startAt"] = *input.StartAt
	}
	if input.EndAt != nil {
		row["endAt"] = *input.EndAt
	}
	if err := createRow(cl, "ad_campaigns", campaignId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "advertising.campaign_scheduled.v1", campaignId, actorOrEmpty(in.ActorId), map[string]interface{}{"campaignId": campaignId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"campaignId": campaignId})
}

func adCampaignList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ad_campaigns", service.WithListRowsQueries([]string{
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func adCampaignSetStatus(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		CampaignId string `json:"campaignId"`
		Status     string `json:"status"`
	}
	if !decode(ctx, in, &input) || input.CampaignId == "" || input.Status == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	valid := map[string]bool{"DRAFT": true, "SCHEDULED": true, "ACTIVE": true, "PAUSED": true, "COMPLETED": true, "ARCHIVED": true}
	if !valid[input.Status] {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "ad_campaigns", input.CampaignId, map[string]interface{}{"status": input.Status, "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "advertising.campaign_status_changed.v1", input.CampaignId, actorOrEmpty(in.ActorId), map[string]interface{}{"campaignId": input.CampaignId, "status": input.Status}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"campaignId": input.CampaignId, "status": input.Status})
}

func adPlacementList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ad_placements", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[100]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func adPlacementCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PlacementKey string `json:"placementKey"`
		Label        string `json:"label"`
	}
	if !decode(ctx, in, &input) || input.PlacementKey == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	placementId := idOrUUID(in.IdempotencyKey)
	now := now()
	row := map[string]interface{}{"placementKey": input.PlacementKey, "status": "ACTIVE", "createdAt": now, "updatedAt": now}
	if input.Label != "" {
		row["label"] = input.Label
	}
	if err := createRow(cl, "ad_placements", placementId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"placementId": placementId})
}

func adEventIngest(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		EventType   string `json:"eventType"`
		CampaignId  string `json:"campaignId"`
		PlacementId string `json:"placementId"`
		CreativeId  string `json:"creativeId"`
	}
	if !decode(ctx, in, &input) || input.EventType == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	eventId := idOrUUID(in.IdempotencyKey)
	row := map[string]interface{}{
		"eventType": input.EventType, "occurredAt": now(), "actorId": actorOrEmpty(in.ActorId),
	}
	if input.CampaignId != "" {
		row["campaignId"] = input.CampaignId
	}
	if input.PlacementId != "" {
		row["placementId"] = input.PlacementId
	}
	if input.CreativeId != "" {
		row["creativeId"] = input.CreativeId
	}
	if in.CorrelationId != "" {
		row["correlationId"] = in.CorrelationId
	}
	if err := createRow(cl, "ad_events", eventId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "advertising.event_ingested.v1", eventId, actorOrEmpty(in.ActorId), map[string]interface{}{"eventId": eventId, "eventType": input.EventType}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"eventId": eventId})
}

// --- admin analytics helpers ---

func countRows(cl client.Client, table string, queries ...string) int {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, table, service.WithListRowsQueries(queries), service.WithListRowsTotal(true))
	if err != nil {
		return 0
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return 0
	}
	if t, ok := raw["total"].(float64); ok {
		return int(t)
	}
	rows, _ := raw["rows"].([]interface{})
	return len(rows)
}

func sumInt(cl client.Client, table, field string, queries ...string) int {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, table, service.WithListRowsQueries(queries))
	if err != nil {
		return 0
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return 0
	}
	rows, _ := raw["rows"].([]interface{})
	sum := 0
	for _, r := range rows {
		m, _ := r.(map[string]interface{})
		sum += toInt(m[field])
	}
	return sum
}

// dailySeries groups rows by day (sumField != "" sums the field, else counts).
func dailySeries(cl client.Client, table, dateField, sumField string, days int, queries ...string) []map[string]interface{} {
	service := tablesdb.New(cl)
	start := time.Now().AddDate(0, 0, -days+1)
	q := append([]string{}, queries...)
	q = append(q,
		`{"method":"greaterThanEqual","attribute":"`+dateField+`","values":["`+start.Format(time.RFC3339Nano)+`"]}`,
		`{"method":"limit","values":[10000]}`,
	)
	list, err := service.ListRows(databaseID, table, service.WithListRowsQueries(q))
	if err != nil {
		return nil
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return nil
	}
	rows, _ := raw["rows"].([]interface{})
	dayValues := map[string]int{}
	for _, r := range rows {
		m, _ := r.(map[string]interface{})
		ts, _ := m[dateField].(string)
		if len(ts) < 10 {
			continue
		}
		day := ts[:10]
		if sumField != "" {
			dayValues[day] += toInt(m[sumField])
		} else {
			dayValues[day]++
		}
	}
	series := make([]map[string]interface{}, 0, days)
	for i := days - 1; i >= 0; i-- {
		day := start.AddDate(0, 0, i).Format("2006-01-02")
		series = append(series, map[string]interface{}{"date": day, "value": dayValues[day]})
	}
	return series
}

func adminSupportTicketList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "support_tickets", service.WithListRowsQueries([]string{
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func adminSupportTicketGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		TicketId string `json:"ticketId"`
	}
	if !decode(ctx, in, &input) || input.TicketId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "support_tickets", input.TicketId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var m map[string]interface{}
	if err := row.Decode(&m); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, m)
}

func adminSupportTicketUpdate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		TicketId string `json:"ticketId"`
		Status   string `json:"status"`
	}
	if !decode(ctx, in, &input) || input.TicketId == "" || (input.Status != "OPEN" && input.Status != "CLOSED") {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "support_tickets", input.TicketId, map[string]interface{}{
		"status":    input.Status,
		"updatedAt": now(),
	}); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

func adminOverviewGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	now30 := time.Now().Add(-30 * 24 * time.Hour).Format(time.RFC3339Nano)

	activePaid := countRows(cl, "subscriptions", qEqual("status", "ACTIVE"))
	mrrCents := sumInt(cl, "subscriptions", "amount", qEqual("status", "ACTIVE"), qEqual("billingInterval", "MONTH"))
	newSubs := countRows(cl, "subscriptions", `{"method":"greaterThanEqual","attribute":"createdAt","values":["`+now30+`"]}`)
	churned := countRows(cl, "subscriptions", `{"method":"greaterThanEqual","attribute":"cancelledAt","values":["`+now30+`"]}`)
	revenueCents := sumInt(cl, "payments", "amount", qEqual("status", "CAPTURED"), `{"method":"greaterThanEqual","attribute":"createdAt","values":["`+now30+`"]}`)
	activeReaders := countRows(cl, "reading_progress", `{"method":"greaterThanEqual","attribute":"lastAccessedAt","values":["`+now30+`"]}`)
	published := countRows(cl, "publications", qEqual("status", "PUBLISHED"))

	revenueTrend := dailySeries(cl, "payments", "createdAt", "amount", 30, qEqual("status", "CAPTURED"))
	newSubTrend := dailySeries(cl, "subscriptions", "createdAt", "", 30)
	churnTrend := dailySeries(cl, "subscriptions", "cancelledAt", "", 30)

	return success(ctx, in, map[string]interface{}{
		"kpis": map[string]interface{}{
			"activePaidSubscribers": activePaid,
			"mrrCents":              mrrCents,
			"newSubscribers30d":     newSubs,
			"churned30d":            churned,
			"revenue30dCents":       revenueCents,
			"activeReaders30d":      activeReaders,
			"publishedContent":      published,
			"aiJobs30d":             0,
		},
		"charts": map[string]interface{}{
			"revenueTrend":       revenueTrend,
			"newSubscriberTrend": newSubTrend,
			"churnTrend":         churnTrend,
		},
	})
}

func adminUsersList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	u := users.New(cl)
	list, err := u.List(
		u.WithListQueries([]string{
			`{"method":"orderDesc","attribute":"$createdAt"}`,
			`{"method":"limit","values":[100]}`,
		}),
		u.WithListTotal(true),
	)
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	items := make([]map[string]interface{}, 0, len(list.Users))
	for _, u := range list.Users {
		items = append(items, map[string]interface{}{
			"$id":           u.Id,
			"name":          u.Name,
			"email":         u.Email,
			"labels":        u.Labels,
			"createdAt":     u.CreatedAt,
			"emailVerified": u.EmailVerification,
			"phoneVerified": u.PhoneVerification,
		})
	}
	return success(ctx, in, map[string]interface{}{"items": items, "total": list.Total})
}

// adminListRows lists a domain table for the admin surface (admin-only, newest first).
func adminListRows(ctx openruntimes.Context, in *GatewayInput, cl client.Client, table string) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, table, service.WithListRowsQueries([]string{
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

// --- destructive admin (approval/break-glass) ---

var destructiveActions = map[string]bool{
	"REFUND":                       true,
	"PRIVATE_MESSAGE_ACCESS":       true,
	"MEDIA_DISTRIBUTION_CONFIGURE": true,
	"SUPPORT_POLICY_MANAGE":        true,
	"ECONOMICS_GOVERNANCE_READ":    true,
	"ECONOMICS_PRICING_READ":       true,
	"ECONOMICS_RESERVES_READ":      true,
	"ECONOMICS_TAX_READ":           true,
}

func adminDestructiveRequest(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		Action   string `json:"action"`
		TargetId string `json:"targetId"`
		Reason   string `json:"reason"`
	}
	if !decode(ctx, in, &input) || input.Action == "" || input.Reason == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !destructiveActions[input.Action] {
		return respond(ctx, in.OperationId, "UNKNOWN_ACTION", false)
	}
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	requestId := idOrUUID(in.IdempotencyKey)
	row := map[string]interface{}{
		"action": input.Action, "status": "PENDING", "requestedBy": actorOrEmpty(in.ActorId),
		"reason": input.Reason, "createdAt": now(),
	}
	if input.TargetId != "" {
		row["targetId"] = input.TargetId
	}
	if err := createRow(cl, "destructive_requests", requestId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "admin.destructive.requested.v1", requestId, actorOrEmpty(in.ActorId), map[string]interface{}{"requestId": requestId, "action": input.Action}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"requestId": requestId})
}

func adminDestructiveApprove(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		RequestId string `json:"requestId"`
	}
	if !decode(ctx, in, &input) || input.RequestId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "destructive_requests", input.RequestId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return internalFailure(ctx, in, err)
	}
	if m["status"] != "PENDING" {
		return respond(ctx, in.OperationId, "INVALID_STATE", false)
	}
	requester, _ := m["requestedBy"].(string)
	approver := actorOrEmpty(in.ActorId)
	if requester == approver {
		return respond(ctx, in.OperationId, "SELF_APPROVAL_FORBIDDEN", false)
	}
	if err := updateRow(cl, "destructive_requests", input.RequestId, map[string]interface{}{"status": "APPROVED", "approvedBy": approver, "approvedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "admin.destructive.approved.v1", input.RequestId, actorOrEmpty(in.ActorId), map[string]interface{}{"requestId": input.RequestId, "approvedBy": approver}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"requestId": input.RequestId})
}

func executeRefund(cl client.Client, requestId, paymentId string) error {
	service := tablesdb.New(cl)
	amount := 0
	if p, err := service.GetRow(databaseID, "payments", paymentId); err == nil {
		var pm map[string]interface{}
		if p.Decode(&pm) == nil {
			amount = toInt(pm["amount"])
		}
	}
	// Idempotent: the refund row $id is the destructive requestId.
	row := map[string]interface{}{
		"paymentId": paymentId, "amount": amount, "currency": "USD", "status": "REQUESTED",
		"reason": "destructive_approval_refund", "createdAt": now(),
	}
	if err := createRow(cl, "refunds", requestId, row); err != nil {
		// duplicate refund is harmless
	}
	return updateRow(cl, "payments", paymentId, map[string]interface{}{"status": "REFUNDED", "updatedAt": now()})
}

func adminDestructiveExecute(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		RequestId string `json:"requestId"`
	}
	if !decode(ctx, in, &input) || input.RequestId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "destructive_requests", input.RequestId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return internalFailure(ctx, in, err)
	}
	if m["status"] != "APPROVED" {
		return respond(ctx, in.OperationId, "NOT_APPROVED", false)
	}
	action, _ := m["action"].(string)
	targetId, _ := m["targetId"].(string)
	if action == "REFUND" {
		if targetId == "" {
			return respond(ctx, in.OperationId, "INVALID_INPUT", false)
		}
		if err := executeRefund(cl, input.RequestId, targetId); err != nil {
			return internalFailure(ctx, in, err)
		}
	}
	if err := updateRow(cl, "destructive_requests", input.RequestId, map[string]interface{}{"status": "EXECUTED", "executedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "admin.destructive.executed.v1", input.RequestId, actorOrEmpty(in.ActorId), map[string]interface{}{"requestId": input.RequestId, "action": action}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"requestId": input.RequestId})
}

func adminDestructiveList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "destructive_requests", service.WithListRowsQueries([]string{
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func adminUserGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		UserId string `json:"userId"`
	}
	if !decode(ctx, in, &input) || input.UserId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	u, err := users.New(cl).Get(input.UserId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	return success(ctx, in, map[string]interface{}{
		"$id":           u.Id,
		"name":          u.Name,
		"email":         u.Email,
		"labels":        u.Labels,
		"createdAt":     u.CreatedAt,
		"emailVerified": u.EmailVerification,
		"phoneVerified": u.PhoneVerification,
	})
}

func adminPublicationGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		PublicationId string `json:"publicationId"`
	}
	if !decode(ctx, in, &input) || input.PublicationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "publications", input.PublicationId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, m)
}

func adminCreatorGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		ActorId string `json:"actorId"`
	}
	if !decode(ctx, in, &input) || input.ActorId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "creators", service.WithListRowsQueries([]string{
		qEqual("actorId", input.ActorId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	return success(ctx, in, rows[0])
}

func countByField(cl client.Client, table, field string) map[string]int {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, table, service.WithListRowsQueries([]string{
		`{"method":"limit","values":[10000]}`,
	}))
	if err != nil {
		return map[string]int{}
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return map[string]int{}
	}
	rows, _ := raw["rows"].([]interface{})
	counts := map[string]int{}
	for _, r := range rows {
		m, _ := r.(map[string]interface{})
		v, _ := m[field].(string)
		if v == "" {
			v = "(empty)"
		}
		counts[v]++
	}
	return counts
}

func adminAnalyticsGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	return success(ctx, in, map[string]interface{}{
		"contentByType":         countByField(cl, "publications", "type"),
		"contentByStatus":       countByField(cl, "publications", "status"),
		"subscriptionsByStatus": countByField(cl, "subscriptions", "status"),
		"paymentsByProvider":    countByField(cl, "payments", "provider"),
		"paymentsByStatus":      countByField(cl, "payments", "status"),
		"creatorsByStatus":      countByField(cl, "creators", "creatorStatus"),
	})
}

func adminOperationsGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	return success(ctx, in, map[string]interface{}{
		"domainEvents":        countRows(cl, "domain_events"),
		"analyticsEvents":     countRows(cl, "analytics_events"),
		"generationsByStatus": countByField(cl, "studio_generation_requests", "status"),
		"pendingGenerations":  countRows(cl, "studio_generation_requests", qEqual("status", "RESERVED")) + countRows(cl, "studio_generation_requests", qEqual("status", "QUEUED")),
		"failedGenerations":   countRows(cl, "studio_generation_requests", qEqual("status", "FAILED")),
	})
}

func adminSecurityGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	return success(ctx, in, map[string]interface{}{
		"auditEvents":  countRows(cl, "audit_events"),
		"domainEvents": countRows(cl, "domain_events"),
	})
}

func incidentCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		Severity   string   `json:"severity"`
		Subsystem  string   `json:"subsystem"`
		Summary    string   `json:"summary"`
		Owner      string   `json:"owner"`
		RelatedIds []string `json:"relatedIds"`
	}
	if !decode(ctx, in, &input) || input.Severity == "" || input.Subsystem == "" || input.Summary == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	rowId := newUUID()
	row := map[string]interface{}{
		"id": rowId, "severity": input.Severity, "status": "OPEN",
		"subsystem": input.Subsystem, "summary": input.Summary,
		"startedAt": now(), "createdAt": now(),
	}
	if input.Owner != "" {
		row["owner"] = input.Owner
	}
	if len(input.RelatedIds) > 0 {
		row["relatedIds"] = input.RelatedIds
	}
	if err := createRow(cl, "incidents", rowId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true, "incidentId": rowId})
}

func incidentList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "incidents", service.WithListRowsQueries([]string{
		`{"method":"orderDesc","attribute":"$createdAt"}`,
		`{"method":"limit","values":[100]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func incidentUpdate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		IncidentId string `json:"incidentId"`
		Status     string `json:"status"`
		Resolution string `json:"resolution"`
	}
	if !decode(ctx, in, &input) || input.IncidentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	data := map[string]interface{}{}
	if input.Status != "" {
		data["status"] = input.Status
	}
	if input.Resolution != "" {
		data["resolution"] = input.Resolution
	}
	if input.Status == "RESOLVED" {
		data["resolvedAt"] = now()
	}
	if err := updateRow(cl, "incidents", input.IncidentId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

// adminPlanProfitability returns active subscribers + monthly revenue grouped by plan.
func adminPlanProfitability(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	subs := listRowsByField(cl, "subscriptions", "status", "ACTIVE")
	byPlan := map[string]map[string]interface{}{}
	order := make([]string, 0)
	for _, s := range subs {
		planId, _ := s["planId"].(string)
		if planId == "" {
			planId = "(none)"
		}
		if _, ok := byPlan[planId]; !ok {
			byPlan[planId] = map[string]interface{}{"planId": planId, "activeSubscribers": 0, "mrrCents": 0}
			order = append(order, planId)
		}
		byPlan[planId]["activeSubscribers"] = toInt(byPlan[planId]["activeSubscribers"]) + 1
		byPlan[planId]["mrrCents"] = toInt(byPlan[planId]["mrrCents"]) + toInt(s["amount"])
	}
	items := make([]map[string]interface{}, 0, len(order))
	for _, id := range order {
		items = append(items, byPlan[id])
	}
	return success(ctx, in, map[string]interface{}{"items": items})
}

func alertCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		Name      string `json:"name"`
		Metric    string `json:"metric"`
		Operator  string `json:"operator"`
		Threshold int    `json:"threshold"`
		Severity  string `json:"severity"`
	}
	if !decode(ctx, in, &input) || input.Name == "" || input.Metric == "" || input.Operator == "" || input.Severity == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	rowId := newUUID()
	if err := createRow(cl, "alerts", rowId, map[string]interface{}{
		"id": rowId, "name": input.Name, "metric": input.Metric, "operator": input.Operator,
		"threshold": input.Threshold, "severity": input.Severity, "enabled": true, "createdAt": now(),
	}); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true, "alertId": rowId})
}

func alertList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "alerts", service.WithListRowsQueries([]string{
		`{"method":"orderAsc","attribute":"name"}`,
		`{"method":"limit","values":[100]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func alertUpdate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		AlertId string `json:"alertId"`
		Enabled *bool  `json:"enabled"`
	}
	if !decode(ctx, in, &input) || input.AlertId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	data := map[string]interface{}{}
	if input.Enabled != nil {
		data["enabled"] = *input.Enabled
	}
	if err := updateRow(cl, "alerts", input.AlertId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

// metricValue computes the current value of a supported alert metric.
func metricValue(cl client.Client, metric string) int {
	switch metric {
	case "generation.pending":
		return countRows(cl, "studio_generation_requests", qEqual("status", "RESERVED")) + countRows(cl, "studio_generation_requests", qEqual("status", "QUEUED"))
	case "generation.failed":
		return countRows(cl, "studio_generation_requests", qEqual("status", "FAILED"))
	case "domain_events.count":
		return countRows(cl, "domain_events")
	case "analytics_events.count":
		return countRows(cl, "analytics_events")
	case "incidents.open":
		return countRows(cl, "incidents", qEqual("status", "OPEN")) + countRows(cl, "incidents", qEqual("status", "INVESTIGATING"))
	default:
		return latestMetricPoint(cl, metric)
	}
}

// latestMetricPoint returns the most recent recorded value for an external metric.
func latestMetricPoint(cl client.Client, metric string) int {
	rows := listRowsByField(cl, "metric_points", "metric", metric)
	if len(rows) == 0 {
		return 0
	}
	return toInt(rows[len(rows)-1]["value"])
}

// metricIngest records an external metric point (e.g. MCP latency, workflow backlog).
func metricIngest(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		Metric string `json:"metric"`
		Value  int    `json:"value"`
	}
	if !decode(ctx, in, &input) || input.Metric == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	rowId := newUUID()
	if err := createRow(cl, "metric_points", rowId, map[string]interface{}{
		"id": rowId, "metric": input.Metric, "value": input.Value, "recordedAt": now(),
	}); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

// triggerCloudflareWorkflows triggers the durable Cloudflare Workflows by
// calling each workflow Worker's HTTP trigger endpoint (shared-secret guarded).
// This Appwrite Functions cron replaces the Workers-Paid-gated `schedules`
// cron and avoids a Cloudflare API token. Requires CF_TRIGGER_SECRET plus the
// per-workflow Worker URLs (CF_GENERATION_URL, CF_OUTBOX_URL, CF_REDACTION_URL).
func triggerCloudflareWorkflows(ctx openruntimes.Context) {
	secret := os.Getenv("CF_TRIGGER_SECRET")
	if secret == "" {
		ctx.Log("api: cloudflare workflow trigger skipped", "reason=CF_TRIGGER_SECRET unset")
		return
	}
	triggerCloudflareHTTP(ctx, os.Getenv("CF_GENERATION_URL"), "generation", secret)
	triggerCloudflareHTTP(ctx, os.Getenv("CF_OUTBOX_URL"), "outbox-delivery", secret)
	// Prompt redaction is a daily sweep; run on the first firing of each UTC day.
	nowUTC := time.Now().UTC()
	if nowUTC.Hour() == 0 && nowUTC.Minute() < 5 {
		triggerCloudflareHTTP(ctx, os.Getenv("CF_REDACTION_URL"), "prompt-redaction", secret)
	}
}

func triggerCloudflareHTTP(ctx openruntimes.Context, url, workflowName, secret string) {
	if url == "" {
		ctx.Log("api: cloudflare trigger skipped", "workflow="+workflowName, "reason=url unset")
		return
	}
	req, err := http.NewRequest(http.MethodPost, url, nil)
	if err != nil {
		ctx.Error("api: cloudflare trigger request build failed", err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+secret)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		ctx.Error("api: cloudflare trigger request failed", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		ctx.Error("api: cloudflare trigger rejected", fmt.Errorf("%s: HTTP %d: %s", workflowName, resp.StatusCode, string(body)))
		return
	}
	ctx.Log("api: triggered cloudflare workflow", "workflow="+workflowName)
}

func evaluateOperator(op string, value, threshold int) bool {
	switch op {
	case "gt":
		return value > threshold
	case "gte":
		return value >= threshold
	case "lt":
		return value < threshold
	case "lte":
		return value <= threshold
	default:
		return false
	}
}

// evaluateAlertsCore evaluates enabled alerts + records triggers (no auth check;
// callers must authorize). Returns the evaluation results.
func evaluateAlertsCore(cl client.Client) ([]map[string]interface{}, error) {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "alerts", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[100]}`,
	}))
	if err != nil {
		return nil, err
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return nil, err
	}
	rows, _ := raw["rows"].([]interface{})
	results := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		m, ok := r.(map[string]interface{})
		if !ok {
			continue
		}
		if enabled, _ := m["enabled"].(bool); !enabled {
			continue
		}
		alertId, _ := m["$id"].(string)
		name, _ := m["name"].(string)
		metric, _ := m["metric"].(string)
		operator, _ := m["operator"].(string)
		threshold := toInt(m["threshold"])
		severity, _ := m["severity"].(string)
		value := metricValue(cl, metric)
		triggered := evaluateOperator(operator, value, threshold)
		if triggered {
			if err := updateRow(cl, "alerts", alertId, map[string]interface{}{"lastTriggeredAt": now()}); err == nil {
				rowId := newUUID()
				_ = createRow(cl, "incidents", rowId, map[string]interface{}{
					"id": rowId, "severity": severity, "status": "OPEN",
					"subsystem": metric, "summary": "Alert triggered: " + name,
					"startedAt": now(), "createdAt": now(),
				})
				notifId := newUUID()
				_ = createRow(cl, "notifications", notifId, map[string]interface{}{
					"id": notifId, "userId": "admin-service-account", "type": "ALERT",
					"subject": "Alert triggered: " + name,
					"body":    "Metric " + metric + " is " + fmt.Sprint(value) + " (threshold " + fmt.Sprint(threshold) + ").",
					"status":  "PENDING", "createdAt": now(),
				})
			}
		}
		results = append(results, map[string]interface{}{
			"alertId": alertId, "name": name, "metric": metric, "value": value,
			"threshold": threshold, "triggered": triggered,
		})
	}
	return results, nil
}

// alertEvaluate evaluates enabled alerts against their metrics. A triggered alert
// records lastTriggeredAt and opens an incident.
func alertEvaluate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	results, err := evaluateAlertsCore(cl)
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"items": results})
}

// sumCreditAmount sums the ai_credit_transactions amount by status.
func sumCreditAmount(cl client.Client, status string) int {
	sum := 0
	for _, m := range listRowsByField(cl, "ai_credit_transactions", "status", status) {
		sum += toInt(m["amount"])
	}
	return sum
}

func adminAiCost(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	return success(ctx, in, map[string]interface{}{
		"creditsReserved": sumCreditAmount(cl, "RESERVED"),
		"creditsSettled":  sumCreditAmount(cl, "SETTLED"),
		"creditsRefunded": sumCreditAmount(cl, "REFUNDED"),
	})
}

func adminAnalyticsEventsList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "analytics_events", service.WithListRowsQueries([]string{
		`{"method":"orderDesc","attribute":"occurredAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func adminAnalyticsAggregate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	start := time.Now().AddDate(0, 0, -29)
	list, err := service.ListRows(databaseID, "analytics_events", service.WithListRowsQueries([]string{
		`{"method":"greaterThanEqual","attribute":"occurredAt","values":["` + start.Format(time.RFC3339Nano) + `"]}`,
		`{"method":"limit","values":[10000]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	type key struct{ day, eventType string }
	counts := map[key]int{}
	dayTotals := map[string]int{}
	for _, r := range rows {
		m, _ := r.(map[string]interface{})
		ts, _ := m["occurredAt"].(string)
		eventType, _ := m["eventType"].(string)
		day := ""
		if len(ts) >= 10 {
			day = ts[:10]
		}
		counts[key{day, eventType}]++
		dayTotals[day]++
	}
	updated := now()
	n := 0
	for k, v := range counts {
		if err := createRow(cl, "analytics_metrics_daily", idOrUUID(nil), map[string]interface{}{
			"metricDate": k.day, "metric": "events_by_type", "dimension": "eventType",
			"dimensionValue": k.eventType, "value": v, "updatedAt": updated,
		}); err == nil {
			n++
		}
	}
	for day, v := range dayTotals {
		if err := createRow(cl, "analytics_metrics_daily", idOrUUID(nil), map[string]interface{}{
			"metricDate": day, "metric": "events", "value": v, "updatedAt": updated,
		}); err == nil {
			n++
		}
	}
	return success(ctx, in, map[string]interface{}{"aggregated": n})
}

func adminAnalyticsDailyGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "analytics_metrics_daily", service.WithListRowsQueries([]string{
		`{"method":"orderDesc","attribute":"metricDate"}`,
		`{"method":"limit","values":[1000]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func listAnalyticsEvents(cl client.Client) []map[string]interface{} {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "analytics_events", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[10000]}`,
	}))
	if err != nil {
		return nil
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return nil
	}
	rows, _ := raw["rows"].([]interface{})
	out := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		if m, ok := r.(map[string]interface{}); ok {
			out = append(out, m)
		}
	}
	return out
}

func adminAnalyticsRetentionGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	actorDays := map[string]map[string]bool{}
	for _, m := range listAnalyticsEvents(cl) {
		actorId, _ := m["actorId"].(string)
		ts, _ := m["occurredAt"].(string)
		if actorId == "" || len(ts) < 10 {
			continue
		}
		if actorDays[actorId] == nil {
			actorDays[actorId] = map[string]bool{}
		}
		actorDays[actorId][ts[:10]] = true
	}
	total := len(actorDays)
	returned := 0
	for _, days := range actorDays {
		if len(days) >= 2 {
			returned++
		}
	}
	rate := 0.0
	if total > 0 {
		rate = float64(returned) / float64(total)
	}
	return success(ctx, in, map[string]interface{}{
		"totalActors": total, "returnedActors": returned, "returnRate": rate,
	})
}

func adminAnalyticsFunnelGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	steps := []string{
		"social.creator_create.v1",
		"studio.project.created.v1",
		"studio.document.created.v1",
		"studio.publication.published.v1",
	}
	actorByEvent := map[string]map[string]bool{}
	for _, m := range listAnalyticsEvents(cl) {
		actorId, _ := m["actorId"].(string)
		eventType, _ := m["eventType"].(string)
		if actorId == "" {
			continue
		}
		if actorByEvent[eventType] == nil {
			actorByEvent[eventType] = map[string]bool{}
		}
		actorByEvent[eventType][actorId] = true
	}
	funnel := make([]map[string]interface{}, 0, len(steps))
	for _, s := range steps {
		funnel = append(funnel, map[string]interface{}{"step": s, "actors": len(actorByEvent[s])})
	}
	return success(ctx, in, map[string]interface{}{"funnel": funnel})
}

type actorActivity struct {
	firstDay string
	days     map[string]bool
}

func computeActorActivity(cl client.Client) map[string]actorActivity {
	out := map[string]actorActivity{}
	for _, m := range listAnalyticsEvents(cl) {
		actorId, _ := m["actorId"].(string)
		ts, _ := m["occurredAt"].(string)
		if actorId == "" || len(ts) < 10 {
			continue
		}
		day := ts[:10]
		a := out[actorId]
		if a.days == nil {
			a.days = map[string]bool{}
			a.firstDay = day
		}
		a.days[day] = true
		if day < a.firstDay {
			a.firstDay = day
		}
		out[actorId] = a
	}
	return out
}

func addDays(day string, n int) string {
	t, err := time.Parse("2006-01-02", day)
	if err != nil {
		return ""
	}
	return t.AddDate(0, 0, n).Format("2006-01-02")
}

func adminAnalyticsAcquisitionGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	activity := computeActorActivity(cl)
	newByDay := map[string]int{}
	for _, a := range activity {
		newByDay[a.firstDay]++
	}
	start := time.Now().AddDate(0, 0, -29)
	series := make([]map[string]interface{}, 0, 30)
	for i := 29; i >= 0; i-- {
		day := start.AddDate(0, 0, i).Format("2006-01-02")
		series = append(series, map[string]interface{}{"date": day, "newActors": newByDay[day]})
	}
	return success(ctx, in, map[string]interface{}{"series": series})
}

func adminAnalyticsCohortsGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	activity := computeActorActivity(cl)
	start := time.Now().AddDate(0, 0, -13)
	cohorts := make([]map[string]interface{}, 0, 14)
	for i := 13; i >= 0; i-- {
		cohortDay := start.AddDate(0, 0, i).Format("2006-01-02")
		total, d1, d3, d7 := 0, 0, 0, 0
		for _, a := range activity {
			if a.firstDay != cohortDay {
				continue
			}
			total++
			if a.days[addDays(cohortDay, 1)] {
				d1++
			}
			if a.days[addDays(cohortDay, 3)] {
				d3++
			}
			if a.days[addDays(cohortDay, 7)] {
				d7++
			}
		}
		cohorts = append(cohorts, map[string]interface{}{
			"date": cohortDay, "size": total, "d1": d1, "d3": d3, "d7": d7,
		})
	}
	return success(ctx, in, map[string]interface{}{"cohorts": cohorts})
}

// --- command handlers ---

func createProject(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		WorkspaceId          string  `json:"workspaceId"`
		Name                 string  `json:"name"`
		Description          *string `json:"description"`
		DefaultContentRating *string `json:"defaultContentRating"`
	}
	if !decode(ctx, in, &input) || input.WorkspaceId == "" || input.Name == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	projectId := idOrUUID(in.IdempotencyKey)
	now := now()
	row := map[string]interface{}{"id": projectId, "creatorId": actorOrEmpty(in.ActorId), "workspaceId": input.WorkspaceId, "name": input.Name, "status": "DRAFT", "createdAt": now, "updatedAt": now}
	if input.Description != nil {
		row["description"] = *input.Description
	}
	if input.DefaultContentRating != nil {
		row["defaultContentRating"] = *input.DefaultContentRating
	}
	if err := createRow(cl, "studio_projects", projectId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.project.created.v1", projectId, actorOrEmpty(in.ActorId), map[string]interface{}{"projectId": projectId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"projectId": projectId})
}

func updateProject(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ProjectId            string  `json:"projectId"`
		Name                 *string `json:"name"`
		Description          *string `json:"description"`
		DefaultContentRating *string `json:"defaultContentRating"`
		Status               *string `json:"status"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	data := map[string]interface{}{"updatedAt": now()}
	if input.Name != nil {
		data["name"] = *input.Name
	}
	if input.Description != nil {
		data["description"] = *input.Description
	}
	if input.DefaultContentRating != nil {
		data["defaultContentRating"] = *input.DefaultContentRating
	}
	if input.Status != nil {
		data["status"] = *input.Status
	}
	if err := updateRow(cl, "studio_projects", input.ProjectId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.project.updated.v1", input.ProjectId, actorOrEmpty(in.ActorId), map[string]interface{}{"projectId": input.ProjectId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"projectId": input.ProjectId})
}

func createPage(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		DocumentId        string  `json:"documentId"`
		Position          int     `json:"position"`
		TemplateId        *string `json:"templateId"`
		Width             *int    `json:"width"`
		Height            *int    `json:"height"`
		BackgroundAssetId *string `json:"backgroundAssetId"`
		BaseRevisionId    string  `json:"baseRevisionId"`
	}
	if !decode(ctx, in, &input) || input.DocumentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, input.DocumentId, actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	revisionId := input.BaseRevisionId
	if revisionId == "" {
		revisionId = idOrUUID(nil)
	}
	pageId := idOrUUID(nil)
	row := map[string]interface{}{"id": pageId, "documentId": input.DocumentId, "position": input.Position, "panels": []string{}, "revisionId": revisionId}
	if input.TemplateId != nil {
		row["templateId"] = *input.TemplateId
	}
	if input.Width != nil {
		row["width"] = *input.Width
	}
	if input.Height != nil {
		row["height"] = *input.Height
	}
	if input.BackgroundAssetId != nil {
		row["backgroundAssetId"] = *input.BackgroundAssetId
	}
	if err := createRow(cl, "studio_pages", pageId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.page.created.v1", pageId, actorOrEmpty(in.ActorId), map[string]interface{}{"pageId": pageId, "documentId": input.DocumentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"pageId": pageId, "revisionId": revisionId})
}

func movePage(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		DocumentId     string `json:"documentId"`
		PageId         string `json:"pageId"`
		NewPosition    int    `json:"newPosition"`
		BaseRevisionId string `json:"baseRevisionId"`
	}
	if !decode(ctx, in, &input) || input.PageId == "" || input.BaseRevisionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "studio_pages", input.PageId, map[string]interface{}{"position": input.NewPosition}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.page.reordered.v1", input.PageId, actorOrEmpty(in.ActorId), map[string]interface{}{"pageId": input.PageId, "documentId": input.DocumentId, "position": input.NewPosition}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"pageId": input.PageId, "revisionId": input.BaseRevisionId})
}

func createPanel(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PageId         string          `json:"pageId"`
		Position       *int            `json:"position"`
		BaseRevisionId string          `json:"baseRevisionId"`
		Panel          json.RawMessage `json:"panel"`
	}
	if !decode(ctx, in, &input) || input.PageId == "" || len(input.Panel) == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, pageDocumentId(cl, input.PageId), actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var panel struct {
		Bounds json.RawMessage `json:"bounds"`
		Shape  string          `json:"shape"`
		Layers []string        `json:"layers"`
	}
	if err := json.Unmarshal(input.Panel, &panel); err != nil || len(panel.Bounds) == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	revisionId := input.BaseRevisionId
	if revisionId == "" {
		revisionId = idOrUUID(nil)
	}
	panelId := idOrUUID(nil)
	position := 0
	if input.Position != nil {
		position = *input.Position
	}
	row := map[string]interface{}{
		"id": panelId, "pageId": input.PageId, "revisionId": revisionId,
		"bounds": string(panel.Bounds), "position": position,
	}
	if panel.Shape != "" {
		row["shape"] = panel.Shape
	}
	if panel.Layers != nil {
		row["layers"] = panel.Layers
	} else {
		row["layers"] = []string{}
	}
	if err := createRow(cl, "studio_panels", panelId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.panel.created.v1", panelId, actorOrEmpty(in.ActorId), map[string]interface{}{"panelId": panelId, "pageId": input.PageId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"panelId": panelId, "revisionId": revisionId})
}

func updatePanel(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PanelId  string          `json:"panelId"`
		Bounds   json.RawMessage `json:"bounds"`
		Position *int            `json:"position"`
		Shape    *string         `json:"shape"`
	}
	if !decode(ctx, in, &input) || input.PanelId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, panelDocumentId(cl, input.PanelId), actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	data := map[string]interface{}{}
	if len(input.Bounds) > 0 {
		data["bounds"] = string(input.Bounds)
	}
	if input.Position != nil {
		data["position"] = *input.Position
	}
	if input.Shape != nil && *input.Shape != "" {
		data["shape"] = *input.Shape
	}
	if len(data) == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "studio_panels", input.PanelId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.panel.updated.v1", input.PanelId, actorOrEmpty(in.ActorId), map[string]interface{}{"panelId": input.PanelId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"panelId": input.PanelId})
}

func applyEditorOperation(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		DocumentId      string          `json:"documentId"`
		Operation       string          `json:"operation"`
		TargetType      string          `json:"targetType"`
		TargetId        *string         `json:"targetId"`
		Payload         json.RawMessage `json:"payload"`
		BaseRevisionId  string          `json:"baseRevisionId"`
		MutationId      string          `json:"mutationId"`
		ClientId        string          `json:"clientId"`
		ClientTimestamp string          `json:"clientTimestamp"`
	}
	if !decode(ctx, in, &input) || input.DocumentId == "" || input.Operation == "" || input.BaseRevisionId == "" || input.MutationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	opRow := map[string]interface{}{"draftId": input.DocumentId, "baseRevisionId": input.BaseRevisionId, "operation": input.Operation, "targetType": input.TargetType, "payload": string(input.Payload), "actorId": actorOrEmpty(in.ActorId), "clientId": input.ClientId, "clientTimestamp": input.ClientTimestamp}
	if input.TargetId != nil {
		opRow["targetId"] = *input.TargetId
	}
	if err := createRow(cl, "studio_editor_operations", idOrUUID(nil), opRow); err != nil {
		return internalFailure(ctx, in, err)
	}
	revisionId := idOrUUID(nil)
	if err := createRow(cl, "studio_editor_revisions", revisionId, map[string]interface{}{"documentId": input.DocumentId, "revision": 1, "immutable": true, "createdAt": now(), "snapshot": snapshotDocument(cl, input.DocumentId)}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.document.revised.v1", input.DocumentId, actorOrEmpty(in.ActorId), map[string]interface{}{"documentId": input.DocumentId, "revisionId": revisionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"revisionId": revisionId, "applied": true})
}

func restoreRevision(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		DocumentId       string `json:"documentId"`
		TargetRevisionId string `json:"targetRevisionId"`
	}
	if !decode(ctx, in, &input) || input.DocumentId == "" || input.TargetRevisionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, input.DocumentId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	target, err := service.GetRow(databaseID, "studio_editor_revisions", input.TargetRevisionId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var tm map[string]interface{}
	if err := target.Decode(&tm); err != nil {
		return internalFailure(ctx, in, err)
	}
	snapshot, _ := tm["snapshot"].(string)
	if err := restoreDocumentSnapshot(cl, input.DocumentId, snapshot); err != nil {
		return internalFailure(ctx, in, err)
	}
	newRevisionId := idOrUUID(nil)
	if err := createRow(cl, "studio_editor_revisions", newRevisionId, map[string]interface{}{"documentId": input.DocumentId, "revision": 1, "immutable": true, "createdAt": now(), "snapshot": snapshot}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.revision.restored.v1", input.DocumentId, actorId, map[string]interface{}{"documentId": input.DocumentId, "newRevisionId": newRevisionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"newRevisionId": newRevisionId})
}

// snapshotDocument captures a document's pages (and their panels) as JSON.
func snapshotDocument(cl client.Client, documentId string) string {
	pages := listRowsByField(cl, "studio_pages", "documentId", documentId)
	pageDocs := make([]map[string]interface{}, 0, len(pages))
	for _, p := range pages {
		pageId, _ := p["$id"].(string)
		page := map[string]interface{}{
			"templateId": p["templateId"], "width": p["width"], "height": p["height"],
			"backgroundAssetId": p["backgroundAssetId"],
		}
		panels := listRowsByField(cl, "studio_panels", "pageId", pageId)
		panelDocs := make([]map[string]interface{}, 0, len(panels))
		for _, pn := range panels {
			panelDocs = append(panelDocs, map[string]interface{}{
				"shape": pn["shape"], "bounds": pn["bounds"], "layers": pn["layers"],
			})
		}
		page["panels"] = panelDocs
		pageDocs = append(pageDocs, page)
	}
	return mustJSON(map[string]interface{}{"pages": pageDocs})
}

// restoreDocumentSnapshot deletes a document's pages/panels and recreates them
// from a snapshot captured by snapshotDocument.
func restoreDocumentSnapshot(cl client.Client, documentId, snapshot string) error {
	var snap struct {
		Pages []struct {
			TemplateId        interface{} `json:"templateId"`
			Width             interface{} `json:"width"`
			Height            interface{} `json:"height"`
			BackgroundAssetId interface{} `json:"backgroundAssetId"`
			Panels            []struct {
				Shape  interface{} `json:"shape"`
				Bounds interface{} `json:"bounds"`
				Layers interface{} `json:"layers"`
			} `json:"panels"`
		} `json:"pages"`
	}
	if err := json.Unmarshal([]byte(snapshot), &snap); err != nil {
		return err
	}
	service := tablesdb.New(cl)
	for _, p := range listRowsByField(cl, "studio_pages", "documentId", documentId) {
		pageId, _ := p["$id"].(string)
		for _, pn := range listRowsByField(cl, "studio_panels", "pageId", pageId) {
			if pid, _ := pn["$id"].(string); pid != "" {
				_, _ = service.DeleteRow(databaseID, "studio_panels", pid)
			}
		}
		if pageId != "" {
			_, _ = service.DeleteRow(databaseID, "studio_pages", pageId)
		}
	}
	for i, p := range snap.Pages {
		pageId := newUUID()
		panelIds := []string{}
		for _, pn := range p.Panels {
			panelId := newUUID()
			if err := createRow(cl, "studio_panels", panelId, map[string]interface{}{
				"pageId": pageId, "position": len(panelIds), "shape": pn.Shape, "bounds": pn.Bounds, "layers": pn.Layers, "revisionId": idOrUUID(nil),
			}); err != nil {
				return err
			}
			panelIds = append(panelIds, panelId)
		}
		if err := createRow(cl, "studio_pages", pageId, map[string]interface{}{
			"documentId": documentId, "position": i, "templateId": p.TemplateId,
			"width": p.Width, "height": p.Height, "backgroundAssetId": p.BackgroundAssetId,
			"panels": panelIds, "revisionId": idOrUUID(nil),
		}); err != nil {
			return err
		}
	}
	return nil
}

func documentRevisionList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		DocumentId string `json:"documentId"`
	}
	if !decode(ctx, in, &input) || input.DocumentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, input.DocumentId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_editor_revisions", service.WithListRowsQueries([]string{
		qEqual("documentId", input.DocumentId),
		`{"method":"orderDesc","attribute":"$createdAt"}`,
		`{"method":"limit","values":[50]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func requestGeneration(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		RequestId         string            `json:"requestId"`
		ProjectId         string            `json:"projectId"`
		DraftId           *string           `json:"draftId"`
		TargetType        string            `json:"targetType"`
		PromptTemplateId  *string           `json:"promptTemplateId"`
		Prompt            *string           `json:"prompt"`
		Variables         map[string]string `json:"variables"`
		InputAssetIds     []string          `json:"inputAssetIds"`
		BillingMode       string            `json:"billingMode"`
		CreditEligible    *bool             `json:"creditEligible"`
		CreditReason      *string           `json:"creditEligibilityReason"`
		ExecutionLocation string            `json:"executionLocation"`
		Duration          *int              `json:"duration"`
		Resolution        string            `json:"resolution"`
		AspectRatio       string            `json:"aspectRatio"`
		PolicyContext     json.RawMessage   `json:"policyContext"`
	}
	if !decode(ctx, in, &input) || input.RequestId == "" || input.ProjectId == "" || input.TargetType == "" || input.BillingMode == "" || input.ExecutionLocation == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	// Server-authoritative credit eligibility (never trust a client-provided flag).
	creditEligible, creditReason := creditEligibilityFor(input.BillingMode, input.ExecutionLocation)
	status := "QUEUED"
	if creditEligible {
		status = "RESERVED"
	}
	// Resolve a prompt template into a concrete prompt when no direct prompt is given.
	resolvedPrompt := ""
	if input.Prompt != nil {
		resolvedPrompt = *input.Prompt
	}
	if resolvedPrompt == "" && input.PromptTemplateId != nil && *input.PromptTemplateId != "" {
		if rp, err := resolvePromptTemplate(cl, *input.PromptTemplateId, input.Variables); err == nil {
			resolvedPrompt = rp
		}
	}
	row := map[string]interface{}{
		"requestId": input.RequestId, "projectId": input.ProjectId, "targetType": input.TargetType,
		"billingMode": input.BillingMode, "executionLocation": input.ExecutionLocation,
		"policyContext": string(input.PolicyContext), "creditEligible": creditEligible,
		"creditEligibilityReason": creditReason, "status": status,
	}
	if input.DraftId != nil {
		row["draftId"] = *input.DraftId
	}
	if input.PromptTemplateId != nil {
		row["promptTemplateId"] = *input.PromptTemplateId
	}
	if resolvedPrompt != "" {
		row["prompt"] = resolvedPrompt
	}
	if len(input.InputAssetIds) > 0 {
		row["inputAssetIds"] = input.InputAssetIds
	}
	if input.Duration != nil && *input.Duration > 0 {
		row["duration"] = *input.Duration
	}
	if input.Resolution != "" {
		row["resolution"] = input.Resolution
	}
	if input.AspectRatio != "" {
		row["aspectRatio"] = input.AspectRatio
	}
	if err := createRow(cl, "studio_generation_requests", input.RequestId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	if creditEligible {
		if err := createCreditTransaction(cl, input.RequestId, actorId, "RESERVE", resolveModelCreditCost(cl, input.TargetType)); err != nil {
			return internalFailure(ctx, in, err)
		}
	}
	emit(ctx, cl, "studio.generation.requested.v1", input.RequestId, actorId, map[string]interface{}{"requestId": input.RequestId, "billingMode": input.BillingMode, "executionLocation": input.ExecutionLocation}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"requestId": input.RequestId, "creditEligible": creditEligible, "creditEligibilityReason": creditReason, "status": status})
}

// creditEligibilityFor returns the server-authoritative credit eligibility for a
// generation request. Only PLATFORM_CREDITS + CLOUD (StoryGalore-managed) execution
// is credit-eligible; BYOK and USER_HOSTED are always ineligible.
func creditEligibilityFor(billingMode, executionLocation string) (bool, string) {
	switch billingMode {
	case "BYOK":
		return false, "BYOK"
	case "USER_HOSTED":
		return false, "USER_HOSTED"
	}
	if executionLocation == "USER_HOSTED" {
		return false, "USER_HOSTED"
	}
	if billingMode == "PLATFORM_CREDITS" && executionLocation == "CLOUD" {
		return true, "STORYGALORE_MANAGED_MODEL"
	}
	return false, "PLATFORM_POLICY_DISABLED"
}

// resolvePromptTemplate returns a prompt template's text with `{{variable}}`
// placeholders substituted from the supplied values.
func resolvePromptTemplate(cl client.Client, templateId string, variables map[string]string) (string, error) {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_prompt_templates", service.WithListRowsQueries([]string{
		qEqual("id", templateId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return "", err
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return "", err
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return "", fmt.Errorf("prompt template not found")
	}
	m, _ := rows[0].(map[string]interface{})
	template, _ := m["template"].(string)
	resolved := template
	for k, v := range variables {
		resolved = strings.ReplaceAll(resolved, "{{"+k+"}}", v)
	}
	return resolved, nil
}

func createCreditTransaction(cl client.Client, generationId, creatorId, kind string, amount int) error {
	txId := newUUID()
	status := "RESERVED"
	if kind == "SETTLE" {
		status = "SETTLED"
	} else if kind == "REFUND" {
		status = "REFUNDED"
	}
	return createRow(cl, "ai_credit_transactions", txId, map[string]interface{}{
		"transactionId": txId,
		"generationId":  generationId,
		"creatorId":     creatorId,
		"kind":          kind,
		"amount":        amount,
		"status":        status,
		"createdAt":     now(),
	})
}

const defaultGenerationCreditCost = 1

// resolveCreditCost returns the default credit-eligible provider's creditCost,
// or the platform default (1 credit) when no such provider is registered.
func resolveCreditCost(cl client.Client) int {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_providers", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return defaultGenerationCreditCost
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return defaultGenerationCreditCost
	}
	rows, _ := raw["rows"].([]interface{})
	for _, r := range rows {
		m, ok := r.(map[string]interface{})
		if !ok {
			continue
		}
		status, _ := m["status"].(string)
		loc, _ := m["executionLocation"].(string)
		owner, _ := m["ownerType"].(string)
		eligible, _ := m["creditEligible"].(bool)
		if status == "ACTIVE" && loc == "CLOUD" && owner == "STORYGALORE" && eligible {
			if cost := toInt(m["creditCost"]); cost > 0 {
				return cost
			}
		}
	}
	return defaultGenerationCreditCost
}

func targetCapability(targetType string) string {
	switch targetType {
	case "PAGE", "PANEL", "IMAGE", "BACKGROUND":
		return "IMAGE_GENERATION"
	case "VIDEO":
		return "VIDEO_GENERATION"
	default:
		return "TEXT_GENERATION"
	}
}

// resolveModelCreditCost resolves the default model's creditCost for a targetType,
// falling back to the provider-level creditCost or the platform default.
func resolveModelCreditCost(cl client.Client, targetType string) int {
	capability := targetCapability(targetType)
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_models", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[500]}`,
	}))
	if err != nil {
		return resolveCreditCost(cl)
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return resolveCreditCost(cl)
	}
	rows, _ := raw["rows"].([]interface{})
	// Prefer the default model for the capability; fall back to the first match.
	fallbackCost := 0
	for _, r := range rows {
		m, ok := r.(map[string]interface{})
		if !ok {
			continue
		}
		status, _ := m["status"].(string)
		if status != "ACTIVE" {
			continue
		}
		caps, _ := m["capabilities"].([]interface{})
		hasCap := false
		for _, c := range caps {
			if s, _ := c.(string); s == capability {
				hasCap = true
				break
			}
		}
		if !hasCap {
			continue
		}
		cost := toInt(m["creditCost"])
		if cost <= 0 {
			cost = defaultGenerationCreditCost
		}
		if isDefault, _ := m["isDefault"].(bool); isDefault {
			return cost
		}
		if fallbackCost == 0 {
			fallbackCost = cost
		}
	}
	if fallbackCost > 0 {
		return fallbackCost
	}
	return resolveCreditCost(cl)
}

// reservedCreditAmount returns the amount reserved for a generation (0 if none).
func reservedCreditAmount(cl client.Client, generationId string) int {
	for _, m := range listRowsByField(cl, "ai_credit_transactions", "generationId", generationId) {
		if kind, _ := m["kind"].(string); kind == "RESERVE" {
			return toInt(m["amount"])
		}
	}
	return 0
}

// generationRowOf returns the status + projectId of a generation request.
func generationRowOf(cl client.Client, generationId string) (status, projectId string, ok bool) {
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "studio_generation_requests", generationId)
	if err != nil {
		return "", "", false
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return "", "", false
	}
	status, _ = m["status"].(string)
	projectId, _ = m["projectId"].(string)
	return status, projectId, true
}

func generationCancel(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		GenerationId string `json:"generationId"`
	}
	if !decode(ctx, in, &input) || input.GenerationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	status, projectId, ok := generationRowOf(cl, input.GenerationId)
	if !ok || projectId == "" || !projectOwnedByActor(cl, projectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	switch status {
	case "COMPLETED", "FAILED", "CANCELLED":
		return respond(ctx, in.OperationId, "CONFLICT", false)
	}
	if err := updateRow(cl, "studio_generation_requests", input.GenerationId, map[string]interface{}{"status": "CANCELLED", "completedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	if status == "RESERVED" || status == "PROCESSING" {
		if amount := reservedCreditAmount(cl, input.GenerationId); amount > 0 {
			_ = createCreditTransaction(cl, input.GenerationId, actorId, "REFUND", amount)
		}
	}
	emit(ctx, cl, "studio.generation.cancelled.v1", input.GenerationId, actorId, map[string]interface{}{"generationId": input.GenerationId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"status": "CANCELLED"})
}

func generationFail(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		GenerationId string `json:"generationId"`
	}
	if !decode(ctx, in, &input) || input.GenerationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	status, _, ok := generationRowOf(cl, input.GenerationId)
	if !ok {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	if status != "PROCESSING" && status != "SETTLING" {
		return respond(ctx, in.OperationId, "CONFLICT", false)
	}
	if err := updateRow(cl, "studio_generation_requests", input.GenerationId, map[string]interface{}{"status": "FAILED", "completedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	if amount := reservedCreditAmount(cl, input.GenerationId); amount > 0 {
		_ = createCreditTransaction(cl, input.GenerationId, generationCreatorId(cl, input.GenerationId), "REFUND", amount)
	}
	emit(ctx, cl, "studio.generation.failed.v1", input.GenerationId, actorOrEmpty(in.ActorId), map[string]interface{}{"generationId": input.GenerationId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"status": "FAILED"})
}

// generationCreatorId resolves the creator who owns a generation request (via its project).
func generationCreatorId(cl client.Client, generationId string) string {
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "studio_generation_requests", generationId)
	if err != nil {
		return ""
	}
	var m map[string]interface{}
	if row.Decode(&m) != nil {
		return ""
	}
	projectId, _ := m["projectId"].(string)
	if projectId == "" {
		return ""
	}
	proj, err := service.GetRow(databaseID, "studio_projects", projectId)
	if err != nil {
		return ""
	}
	var pm map[string]interface{}
	if proj.Decode(&pm) != nil {
		return ""
	}
	creatorId, _ := pm["creatorId"].(string)
	return creatorId
}

func generationComplete(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		GenerationId string `json:"generationId"`
		ProviderId   string `json:"providerId"`
		ModelId      string `json:"modelId"`
		OutputRef    string `json:"outputRef"`
	}
	if !decode(ctx, in, &input) || input.GenerationId == "" || input.ProviderId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	status, _, ok := generationRowOf(cl, input.GenerationId)
	if !ok {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	if status != "PROCESSING" {
		return respond(ctx, in.OperationId, "CONFLICT", false)
	}
	outputId := newUUID()
	outRow := map[string]interface{}{
		"outputId": outputId, "generationId": input.GenerationId,
		"providerId": input.ProviderId, "status": "COMPLETED", "createdAt": now(),
	}
	if input.ModelId != "" {
		outRow["modelId"] = input.ModelId
	}
	if input.OutputRef != "" {
		outRow["outputRef"] = input.OutputRef
	}
	if err := createRow(cl, "ai_generation_outputs", outputId, outRow); err != nil {
		return internalFailure(ctx, in, err)
	}
	if err := updateRow(cl, "studio_generation_requests", input.GenerationId, map[string]interface{}{"status": "COMPLETED", "completedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	if amount := reservedCreditAmount(cl, input.GenerationId); amount > 0 {
		_ = createCreditTransaction(cl, input.GenerationId, generationCreatorId(cl, input.GenerationId), "SETTLE", amount)
	}
	emit(ctx, cl, "studio.generation.completed.v1", input.GenerationId, actorOrEmpty(in.ActorId), map[string]interface{}{"generationId": input.GenerationId, "outputId": outputId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"status": "COMPLETED", "outputId": outputId})
}

func generationProcess(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		GenerationId string `json:"generationId"`
	}
	if !decode(ctx, in, &input) || input.GenerationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	status, _, ok := generationRowOf(cl, input.GenerationId)
	if !ok {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	if status != "RESERVED" && status != "QUEUED" {
		return respond(ctx, in.OperationId, "CONFLICT", false)
	}
	if err := updateRow(cl, "studio_generation_requests", input.GenerationId, map[string]interface{}{"status": "PROCESSING"}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.generation.processing.v1", input.GenerationId, actorOrEmpty(in.ActorId), map[string]interface{}{"generationId": input.GenerationId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"status": "PROCESSING"})
}

func generationListPending(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_generation_requests", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[500]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	pending := make([]interface{}, 0)
	for _, r := range rows {
		m, ok := r.(map[string]interface{})
		if !ok {
			continue
		}
		s, _ := m["status"].(string)
		if s == "QUEUED" || s == "RESERVED" {
			pending = append(pending, m)
		}
	}
	return success(ctx, in, map[string]interface{}{"items": pending})
}

func promptRedactExpired(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	cutoff := time.Now().AddDate(0, 0, -30).UTC().Format(time.RFC3339Nano)
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_generation_requests", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[1000]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	redacted := 0
	for _, r := range rows {
		m, ok := r.(map[string]interface{})
		if !ok {
			continue
		}
		status, _ := m["status"].(string)
		if status != "COMPLETED" && status != "FAILED" && status != "CANCELLED" {
			continue
		}
		completedAt, _ := m["completedAt"].(string)
		if completedAt == "" || completedAt >= cutoff {
			continue
		}
		prompt, _ := m["prompt"].(string)
		if prompt == "" || strings.HasPrefix(prompt, "redacted:") {
			continue
		}
		rowId, _ := m["$id"].(string)
		if rowId == "" {
			continue
		}
		sum := sha256.Sum256([]byte(prompt))
		if err := updateRow(cl, "studio_generation_requests", rowId, map[string]interface{}{"prompt": "redacted:" + hex.EncodeToString(sum[:])}); err != nil {
			return internalFailure(ctx, in, err)
		}
		redacted++
	}
	return success(ctx, in, map[string]interface{}{"redacted": redacted})
}

func aiProviderList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_providers", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if !adminActor(ctx, in, cl) {
		rows = filterByStatus(rows, "ACTIVE")
	}
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func aiProviderGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ProviderId string `json:"providerId"`
	}
	if !decode(ctx, in, &input) || input.ProviderId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_providers", service.WithListRowsQueries([]string{
		qEqual("providerId", input.ProviderId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	m, _ := rows[0].(map[string]interface{})
	if !adminActor(ctx, in, cl) {
		if s, _ := m["status"].(string); s != "ACTIVE" {
			return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
		}
	}
	return success(ctx, in, m)
}

func aiProviderCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		ProviderId        string `json:"providerId"`
		DisplayName       string `json:"displayName"`
		ExecutionLocation string `json:"executionLocation"`
		Protocol          string `json:"protocol"`
		OwnerType         string `json:"ownerType"`
		Ownership         string `json:"ownership"`
		CreditEligible    bool   `json:"creditEligible"`
		CreditCost        int    `json:"creditCost"`
		CredentialRef     string `json:"credentialRef"`
		EndpointRef       string `json:"endpointRef"`
	}
	if !decode(ctx, in, &input) || input.ProviderId == "" || input.DisplayName == "" || input.ExecutionLocation == "" || input.Protocol == "" || input.OwnerType == "" || input.Ownership == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	// Server-enforce: only STORYGALORE-owned CLOUD providers are credit-eligible.
	creditEligible := input.CreditEligible
	if input.OwnerType != "STORYGALORE" || input.ExecutionLocation != "CLOUD" {
		creditEligible = false
	}
	creditCost := input.CreditCost
	if creditCost < 1 {
		creditCost = 1
	}
	rowId := newUUID()
	row := map[string]interface{}{
		"id": rowId, "providerId": input.ProviderId, "displayName": input.DisplayName,
		"executionLocation": input.ExecutionLocation, "protocol": input.Protocol,
		"ownerType": input.OwnerType, "ownership": input.Ownership,
		"creditEligible": creditEligible, "creditCost": creditCost, "status": "ACTIVE", "createdAt": now(),
	}
	if input.CredentialRef != "" {
		row["credentialRef"] = input.CredentialRef
	}
	if input.EndpointRef != "" {
		row["endpointRef"] = input.EndpointRef
	}
	if err := createRow(cl, "ai_providers", rowId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true, "providerId": input.ProviderId, "creditEligible": creditEligible})
}

func aiProviderUpdate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		ProviderId     string `json:"providerId"`
		Status         string `json:"status"`
		CreditEligible *bool  `json:"creditEligible"`
	}
	if !decode(ctx, in, &input) || input.ProviderId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_providers", service.WithListRowsQueries([]string{
		qEqual("providerId", input.ProviderId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	m, _ := rows[0].(map[string]interface{})
	rowId, _ := m["$id"].(string)
	data := map[string]interface{}{}
	if input.Status != "" {
		data["status"] = input.Status
	}
	if input.CreditEligible != nil {
		data["creditEligible"] = *input.CreditEligible
	}
	if err := updateRow(cl, "ai_providers", rowId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

func filterByStatus(rows []interface{}, status string) []interface{} {
	out := make([]interface{}, 0, len(rows))
	for _, r := range rows {
		m, ok := r.(map[string]interface{})
		if !ok {
			continue
		}
		if s, _ := m["status"].(string); s == status {
			out = append(out, m)
		}
	}
	return out
}

func aiModelList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_models", service.WithListRowsQueries([]string{
		`{"method":"limit","values":[500]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if !adminActor(ctx, in, cl) {
		rows = filterByStatus(rows, "ACTIVE")
	}
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func aiModelGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ModelId string `json:"modelId"`
	}
	if !decode(ctx, in, &input) || input.ModelId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_models", service.WithListRowsQueries([]string{
		qEqual("modelId", input.ModelId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	m, _ := rows[0].(map[string]interface{})
	if !adminActor(ctx, in, cl) {
		if s, _ := m["status"].(string); s != "ACTIVE" {
			return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
		}
	}
	return success(ctx, in, m)
}

func aiModelCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		ModelId       string   `json:"modelId"`
		ProviderId    string   `json:"providerId"`
		DisplayName   string   `json:"displayName"`
		Capabilities  []string `json:"capabilities"`
		CreditCost    int      `json:"creditCost"`
		IsDefault     bool     `json:"isDefault"`
		ContextWindow int      `json:"contextWindow"`
		AdultPolicy   string   `json:"adultPolicy"`
	}
	if !decode(ctx, in, &input) || input.ModelId == "" || input.ProviderId == "" || len(input.Capabilities) == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	creditCost := input.CreditCost
	if creditCost < 1 {
		creditCost = 1
	}
	rowId := newUUID()
	row := map[string]interface{}{
		"id": rowId, "modelId": input.ModelId, "providerId": input.ProviderId,
		"capabilities": input.Capabilities, "creditCost": creditCost, "isDefault": input.IsDefault,
		"status": "ACTIVE", "createdAt": now(),
	}
	if input.DisplayName != "" {
		row["displayName"] = input.DisplayName
	}
	if input.ContextWindow > 0 {
		row["contextWindow"] = input.ContextWindow
	}
	if input.AdultPolicy != "" {
		row["adultPolicy"] = input.AdultPolicy
	}
	if err := createRow(cl, "ai_models", rowId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true, "modelId": input.ModelId})
}

func aiModelUpdate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	if !adminActor(ctx, in, cl) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	var input struct {
		ModelId    string `json:"modelId"`
		Status     string `json:"status"`
		CreditCost *int   `json:"creditCost"`
		IsDefault  *bool  `json:"isDefault"`
	}
	if !decode(ctx, in, &input) || input.ModelId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "ai_models", service.WithListRowsQueries([]string{
		qEqual("modelId", input.ModelId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	m, _ := rows[0].(map[string]interface{})
	rowId, _ := m["$id"].(string)
	data := map[string]interface{}{}
	if input.Status != "" {
		data["status"] = input.Status
	}
	if input.CreditCost != nil {
		data["creditCost"] = *input.CreditCost
	}
	if input.IsDefault != nil {
		data["isDefault"] = *input.IsDefault
	}
	if err := updateRow(cl, "ai_models", rowId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true})
}

func promptTemplateList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_prompt_templates", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"orderAsc","attribute":"name"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func promptTemplateCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string   `json:"projectId"`
		Name      string   `json:"name"`
		Template  string   `json:"template"`
		Variables []string `json:"variables"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" || input.Name == "" || input.Template == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	rowId := newUUID()
	if err := createRow(cl, "studio_prompt_templates", rowId, map[string]interface{}{
		"id":        rowId,
		"projectId": input.ProjectId,
		"name":      input.Name,
		"template":  input.Template,
		"variables": input.Variables,
		"revision":  1,
	}); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ok": true, "templateId": rowId})
}

func generationList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	var input struct {
		ProjectId string `json:"projectId"`
	}
	if !decode(ctx, in, &input) || input.ProjectId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !projectOwnedByActor(cl, input.ProjectId, actorId) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "studio_generation_requests", service.WithListRowsQueries([]string{
		qEqual("projectId", input.ProjectId),
		`{"method":"orderDesc","attribute":"$createdAt"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func listRowsByField(cl client.Client, table, field, value string) []map[string]interface{} {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, table, service.WithListRowsQueries([]string{
		qEqual(field, value),
		`{"method":"limit","values":[1000]}`,
	}))
	if err != nil {
		return nil
	}
	var raw map[string]interface{}
	if list.Decode(&raw) != nil {
		return nil
	}
	rows, _ := raw["rows"].([]interface{})
	out := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		if m, ok := r.(map[string]interface{}); ok {
			out = append(out, m)
		}
	}
	return out
}

// creatorAnalyticsGet returns the calling creator's own workspace-level metrics,
// computed live from their projects (never from another creator's data).
func creatorAnalyticsGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	projects := listRowsByField(cl, "studio_projects", "creatorId", actorId)
	documentCount := 0
	promptTemplateCount := 0
	generationTotal := 0
	generationCreditEligible := 0
	generationsByBilling := map[string]int{}
	for _, pm := range projects {
		projectId, _ := pm["$id"].(string)
		if projectId == "" {
			continue
		}
		documentCount += len(listRowsByField(cl, "studio_documents", "projectId", projectId))
		promptTemplateCount += len(listRowsByField(cl, "studio_prompt_templates", "projectId", projectId))
		for _, gm := range listRowsByField(cl, "studio_generation_requests", "projectId", projectId) {
			generationTotal++
			if bm, _ := gm["billingMode"].(string); bm != "" {
				generationsByBilling[bm]++
			}
			if ce, _ := gm["creditEligible"].(bool); ce {
				generationCreditEligible++
			}
		}
	}
	return success(ctx, in, map[string]interface{}{
		"projects":                 len(projects),
		"documents":                documentCount,
		"promptTemplates":          promptTemplateCount,
		"generationTotal":          generationTotal,
		"generationCreditEligible": generationCreditEligible,
		"generationsByBilling":     generationsByBilling,
	})
}

func applyGeneration(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		GenerationId   string `json:"generationId"`
		DocumentId     string `json:"documentId"`
		BaseRevisionId string `json:"baseRevisionId"`
		MutationId     string `json:"mutationId"`
	}
	if !decode(ctx, in, &input) || input.GenerationId == "" || input.DocumentId == "" || input.BaseRevisionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	revisionId := idOrUUID(nil)
	if err := createRow(cl, "studio_editor_revisions", revisionId, map[string]interface{}{"documentId": input.DocumentId, "revision": 1, "immutable": true, "createdAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "studio.generation.applied.v1", input.DocumentId, actorOrEmpty(in.ActorId), map[string]interface{}{"generationId": input.GenerationId, "revisionId": revisionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"revisionId": revisionId})
}

func isSequentialArtDocument(m map[string]interface{}) bool {
	t, _ := m["type"].(string)
	if t != "BOOK" {
		return false
	}
	f, _ := m["format"].(string)
	if f == "" {
		return true
	}
	switch f {
	case "COMIC", "MANGA", "MANHWA", "MANHUA", "BANDE_DESSINEE", "GRAPHIC_NOVEL", "WEBTOON":
		return true
	}
	return false
}

func toInt(v interface{}) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	case int64:
		return int(n)
	case json.Number:
		i, _ := n.Int64()
		return int(i)
	}
	return 0
}

func validatePublication(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		DocumentId string `json:"documentId"`
	}
	if !decode(ctx, in, &input) || input.DocumentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, input.DocumentId, actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	doc, err := service.GetRow(databaseID, "studio_documents", input.DocumentId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var dm map[string]interface{}
	if doc.Decode(&dm) != nil {
		return internalFailure(ctx, in, err)
	}
	violations := []map[string]interface{}{}
	title, _ := dm["title"].(string)
	if strings.TrimSpace(title) == "" {
		violations = append(violations, map[string]interface{}{"code": "MISSING_TITLE", "message": "Document requires a title."})
	}
	if isSequentialArtDocument(dm) {
		pagesList, err := service.ListRows(databaseID, "studio_pages", service.WithListRowsQueries([]string{
			qEqual("documentId", input.DocumentId),
			`{"method":"limit","values":[1]}`,
		}))
		if err != nil {
			return internalFailure(ctx, in, err)
		}
		var praw map[string]interface{}
		_ = pagesList.Decode(&praw)
		rows, _ := praw["rows"].([]interface{})
		if len(rows) == 0 {
			violations = append(violations, map[string]interface{}{"code": "MISSING_PAGES", "message": "Sequential-art books require at least one page."})
		}
	}
	valid := len(violations) == 0
	status := "PASS"
	if !valid {
		status = "FAIL"
	}
	runId := idOrUUID(nil)
	checksJSON, _ := json.Marshal(violations)
	if err := createRow(cl, "studio_publication_validation_runs", runId, map[string]interface{}{"validationId": runId, "status": status, "checks": string(checksJSON), "createdAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	eventType := "studio.publication.validated.v1"
	if !valid {
		eventType = "studio.publication.validation_failed.v1"
	}
	emit(ctx, cl, eventType, input.DocumentId, actorOrEmpty(in.ActorId), map[string]interface{}{"documentId": input.DocumentId, "runId": runId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"validationRunId": runId, "valid": valid, "violations": violations})
}

func publish(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		DocumentId          string          `json:"documentId"`
		PublicationMetadata json.RawMessage `json:"publicationMetadata"`
	}
	if !decode(ctx, in, &input) || input.DocumentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if !documentOwnedByActor(cl, input.DocumentId, actorOrEmpty(in.ActorId)) {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	doc, err := service.GetRow(databaseID, "studio_documents", input.DocumentId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var dm map[string]interface{}
	if doc.Decode(&dm) != nil {
		return internalFailure(ctx, in, err)
	}

	var meta struct {
		Title             string `json:"title"`
		Description       string `json:"description"`
		ContentRating     string `json:"contentRating"`
		ContentOrigin     string `json:"contentOrigin"`
		SeriesId          string `json:"seriesId"`
		VolumeId          string `json:"volumeId"`
		AccessClass       string `json:"accessClass"`
		CoverMediaAssetId string `json:"coverMediaAssetId"`
	}
	if len(input.PublicationMetadata) > 0 {
		_ = json.Unmarshal(input.PublicationMetadata, &meta)
	}

	docType, _ := dm["type"].(string)
	docFormat, _ := dm["format"].(string)
	docReadingFormat, _ := dm["readingFormat"].(string)
	projectId, _ := dm["projectId"].(string)
	docRevisionId, _ := dm["revisionId"].(string)
	if docRevisionId == "" {
		docRevisionId = idOrUUID(nil)
	}
	title := meta.Title
	if title == "" {
		title, _ = dm["title"].(string)
	}
	accessClass := meta.AccessClass
	if accessClass != "SUBSCRIPTION" && accessClass != "PURCHASE" {
		accessClass = "FREE"
	}

	pagesList, err := service.ListRows(databaseID, "studio_pages", service.WithListRowsQueries([]string{
		qEqual("documentId", input.DocumentId),
		`{"method":"orderAsc","attribute":"position"}`,
		`{"method":"limit","values":[1000]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var praw map[string]interface{}
	if err := pagesList.Decode(&praw); err != nil {
		return internalFailure(ctx, in, err)
	}
	pageRows, _ := praw["rows"].([]interface{})

	publicationId := idOrUUID(in.IdempotencyKey)
	snapshotId := idOrUUID(nil)
	now := now()
	mediaAssetIds := []string{}

	for i, pr := range pageRows {
		pm, _ := pr.(map[string]interface{})
		mediaAssetId, _ := pm["backgroundAssetId"].(string)
		if mediaAssetId != "" {
			mediaAssetIds = append(mediaAssetIds, mediaAssetId)
		}
		bpRow := map[string]interface{}{
			"publicationId": publicationId,
			"position":      i,
			"createdAt":     now,
			"updatedAt":     now,
		}
		if mediaAssetId != "" {
			bpRow["mediaAssetId"] = mediaAssetId
		}
		if w := toInt(pm["width"]); w > 0 {
			bpRow["width"] = w
		}
		if h := toInt(pm["height"]); h > 0 {
			bpRow["height"] = h
		}
		if err := createRow(cl, "book_pages", idOrUUID(nil), bpRow); err != nil {
			return internalFailure(ctx, in, err)
		}
	}

	pub := map[string]interface{}{
		"creatorId":   actorOrEmpty(in.ActorId),
		"projectId":   projectId,
		"type":        docType,
		"status":      "PUBLISHED",
		"accessClass": accessClass,
		"publishedAt": now,
		"createdAt":   now,
		"updatedAt":   now,
		"pageCount":   len(pageRows),
	}
	if title != "" {
		pub["title"] = title
	}
	if meta.Description != "" {
		pub["description"] = meta.Description
	}
	if meta.ContentRating != "" {
		pub["contentRating"] = meta.ContentRating
	}
	if meta.ContentOrigin != "" {
		pub["contentOrigin"] = meta.ContentOrigin
	}
	if meta.SeriesId != "" {
		pub["seriesId"] = meta.SeriesId
	}
	if meta.VolumeId != "" {
		pub["volumeId"] = meta.VolumeId
	}
	if docFormat != "" {
		pub["format"] = docFormat
	}
	if docReadingFormat != "" {
		pub["readingFormat"] = docReadingFormat
	}
	if w := toInt(dm["pageWidth"]); w > 0 {
		pub["pageWidth"] = w
	}
	if h := toInt(dm["pageHeight"]); h > 0 {
		pub["pageHeight"] = h
	}
	if len(mediaAssetIds) > 0 {
		pub["mediaAssetIds"] = mediaAssetIds
	}
	if err := createRow(cl, "publications", publicationId, pub); err != nil {
		return internalFailure(ctx, in, err)
	}

	if meta.CoverMediaAssetId != "" {
		if err := updateRow(cl, "media_assets", meta.CoverMediaAssetId, map[string]interface{}{"publicationId": publicationId, "updatedAt": now}); err != nil {
			ctx.Error("publish: cover link failed", err)
		}
	}

	snap := map[string]interface{}{
		"snapshotId":       snapshotId,
		"publicationId":    publicationId,
		"sourceRevisionId": docRevisionId,
		"sourceDocumentId": input.DocumentId,
		"createdAt":        now,
		"immutable":        true,
	}
	if len(mediaAssetIds) > 0 {
		snap["mediaAssetIds"] = mediaAssetIds
	}
	if err := createRow(cl, "studio_publication_snapshots", snapshotId, snap); err != nil {
		return internalFailure(ctx, in, err)
	}

	emit(ctx, cl, "studio.publication.published.v1", publicationId, actorOrEmpty(in.ActorId), map[string]interface{}{"publicationId": publicationId, "snapshotId": snapshotId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"publicationId": publicationId, "snapshotId": snapshotId})
}

// --- community handlers ---

func commentCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		TargetType      string  `json:"targetType"`
		TargetId        string  `json:"targetId"`
		Body            string  `json:"body"`
		ParentCommentId *string `json:"parentCommentId"`
	}
	if !decode(ctx, in, &input) || input.TargetType == "" || input.TargetId == "" || input.Body == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	commentId := idOrUUID(in.IdempotencyKey)
	now := now()
	row := map[string]interface{}{
		"targetType": input.TargetType, "targetId": input.TargetId, "body": input.Body,
		"userId": actorOrEmpty(in.ActorId), "status": "PENDING_REVIEW", "createdAt": now, "updatedAt": now,
	}
	if input.ParentCommentId != nil {
		row["parentCommentId"] = *input.ParentCommentId
	}
	if err := createRow(cl, "comments", commentId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "community.comment_create.v1", commentId, actorOrEmpty(in.ActorId), map[string]interface{}{"commentId": commentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"commentId": commentId})
}

func commentEdit(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		CommentId string `json:"commentId"`
		Body      string `json:"body"`
	}
	if !decode(ctx, in, &input) || input.CommentId == "" || input.Body == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "comments", input.CommentId, map[string]interface{}{"body": input.Body, "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "community.comment_edit.v1", input.CommentId, actorOrEmpty(in.ActorId), map[string]interface{}{"commentId": input.CommentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"commentId": input.CommentId})
}

func commentDelete(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		CommentId string `json:"commentId"`
	}
	if !decode(ctx, in, &input) || input.CommentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "comments", input.CommentId, map[string]interface{}{"status": "REMOVED", "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "community.comment_delete.v1", input.CommentId, actorOrEmpty(in.ActorId), map[string]interface{}{"commentId": input.CommentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"commentId": input.CommentId})
}

func commentReply(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ParentCommentId string `json:"parentCommentId"`
		Body            string `json:"body"`
	}
	if !decode(ctx, in, &input) || input.ParentCommentId == "" || input.Body == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	commentId := idOrUUID(in.IdempotencyKey)
	now := now()
	row := map[string]interface{}{
		"parentCommentId": input.ParentCommentId, "body": input.Body,
		"userId": actorOrEmpty(in.ActorId), "status": "PENDING_REVIEW", "createdAt": now, "updatedAt": now,
	}
	if err := createRow(cl, "comments", commentId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "community.comment_reply.v1", commentId, actorOrEmpty(in.ActorId), map[string]interface{}{"commentId": commentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"commentId": commentId})
}

func commentReact(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		CommentId    string `json:"commentId"`
		ReactionType string `json:"reactionType"`
	}
	if !decode(ctx, in, &input) || input.CommentId == "" || input.ReactionType == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	reactionId := idOrUUID(in.IdempotencyKey)
	row := map[string]interface{}{
		"userId": actorOrEmpty(in.ActorId), "targetType": "COMMENT", "targetId": input.CommentId,
		"reactionType": input.ReactionType, "createdAt": now(),
	}
	if err := createRow(cl, "reactions", reactionId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "community.comment_react.v1", input.CommentId, actorOrEmpty(in.ActorId), map[string]interface{}{"commentId": input.CommentId, "reactionId": reactionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"reactionId": reactionId, "toggled": true})
}

func commentReport(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		CommentId string `json:"commentId"`
		Reason    string `json:"reason"`
	}
	if !decode(ctx, in, &input) || input.CommentId == "" || input.Reason == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	reportId := idOrUUID(in.IdempotencyKey)
	row := map[string]interface{}{
		"reporterId": actorOrEmpty(in.ActorId), "targetType": "COMMENT", "targetId": input.CommentId,
		"reason": input.Reason, "status": "OPEN", "createdAt": now(),
	}
	if err := createRow(cl, "reports", reportId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "community.comment_report.v1", input.CommentId, actorOrEmpty(in.ActorId), map[string]interface{}{"commentId": input.CommentId, "reportId": reportId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"reportId": reportId})
}

func commentModerate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		CommentId string `json:"commentId"`
		Status    string `json:"status"`
	}
	if !decode(ctx, in, &input) || input.CommentId == "" || input.Status == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "comments", input.CommentId, map[string]interface{}{"status": input.Status, "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "community.comment_moderate.v1", input.CommentId, actorOrEmpty(in.ActorId), map[string]interface{}{"commentId": input.CommentId, "status": input.Status}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"commentId": input.CommentId})
}

// --- subscription handlers ---

func subscriptionCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		UserId          string `json:"userId"`
		CreatorId       string `json:"creatorId"`
		PlanId          string `json:"planId"`
		PlanVersion     int    `json:"planVersion"`
		BillingMode     string `json:"billingMode"`
		BillingStrategy string `json:"billingStrategy"`
		Provider        string `json:"provider"`
		Email           string `json:"email"`
	}
	if !decode(ctx, in, &input) || input.UserId == "" || input.PlanId == "" || input.PlanVersion == 0 || input.BillingMode == "" || input.BillingStrategy == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}

	service := tablesdb.New(cl)
	currency, amount, interval, intervalCount := "USD", 0, "MONTH", 1
	if p, err := service.GetRow(databaseID, "plans", input.PlanId); err == nil {
		var m map[string]interface{}
		if p.Decode(&m) == nil {
			if v, ok := m["currency"].(string); ok {
				currency = v
			}
			if v, ok := m["amount"].(float64); ok {
				amount = int(v)
			}
			if v, ok := m["billingInterval"].(string); ok {
				interval = v
			}
			if v, ok := m["billingIntervalCount"].(float64); ok {
				intervalCount = int(v)
			}
		}
	}

	subscriptionId := idOrUUID(in.IdempotencyKey)
	ts := now()
	row := map[string]interface{}{
		"userId": input.UserId, "planId": input.PlanId, "planVersion": input.PlanVersion,
		"status": "CREATED", "billingMode": input.BillingMode, "billingStrategy": input.BillingStrategy,
		"currency": currency, "amount": amount, "billingInterval": interval, "billingIntervalCount": intervalCount,
		"currentPeriodStart": ts, "currentPeriodEnd": ts, "cancelAtPeriodEnd": false, "version": 1,
		"createdAt": ts, "updatedAt": ts,
	}
	if input.CreatorId != "" {
		row["creatorId"] = input.CreatorId
	}
	if input.Provider != "" {
		row["provider"] = input.Provider
	}
	if err := createRow(cl, "subscriptions", subscriptionId, row); err != nil {
		return internalFailure(ctx, in, err)
	}

	// NATIVE_RECURRING: dispatch to the provider's native subscription flow.
	// MERCHANT_MANAGED / MANUAL stay CREATED and activate on the first captured
	// renewal payment (activateSubscriptionForPayment).
	if input.BillingStrategy == "NATIVE_RECURRING" {
		if input.Provider == "NOWPAYMENTS" {
			return delegateToNowpaymentsSubscription(ctx, in, cl, subscriptionId, input.UserId, input.Email, input.PlanId, amount, currency, interval)
		}
		adapter := newProviderAdapter(input.Provider, os.Getenv("STRIPE_SECRET_KEY"))
		if !adapter.SupportsNativeSubscriptions() {
			updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"status": "FAILED", "updatedAt": now()})
			return respond(ctx, in.OperationId, "NATIVE_SUBSCRIPTION_UNSUPPORTED", false)
		}
		providerSubscriptionId, err := adapter.CreateSubscription(context.Background(), input.UserId, subscriptionId, input.PlanId, amount, currency, interval)
		if err != nil {
			ctx.Error("native subscription create failed", "provider="+input.Provider, err)
			updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"status": "FAILED", "updatedAt": now()})
			return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
		}
		updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"providerSubscriptionId": providerSubscriptionId, "status": "AWAITING_PROVIDER", "updatedAt": now()})
	}

	emit(ctx, cl, "subscriptions.subscription_create.v1", subscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": subscriptionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"subscriptionId": subscriptionId})
}

func subscriptionCancel(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		SubscriptionId     string  `json:"subscriptionId"`
		CancellationReason *string `json:"cancellationReason"`
	}
	if !decode(ctx, in, &input) || input.SubscriptionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	data := map[string]interface{}{"status": "CANCELLED", "cancelledAt": now(), "updatedAt": now()}
	if input.CancellationReason != nil {
		data["cancellationReason"] = *input.CancellationReason
	}
	if err := updateRow(cl, "subscriptions", input.SubscriptionId, data); err != nil {
		return internalFailure(ctx, in, err)
	}

	// Cancel the native provider subscription (best-effort: the domain state is
	// already CANCELLED, so a provider-cancel failure only leaves the provider
	// subscription for later reconciliation).
	cancelNativeSubscription(ctx, cl, input.SubscriptionId)

	emit(ctx, cl, "subscriptions.subscription_cancel.v1", input.SubscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": input.SubscriptionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"subscriptionId": input.SubscriptionId})
}

// cancelNativeSubscription cancels the provider-side subscription for a
// NATIVE_RECURRING subscription (Stripe or NOWPayments). Best-effort.
func cancelNativeSubscription(ctx openruntimes.Context, cl client.Client, subscriptionId string) {
	service := tablesdb.New(cl)
	s, err := service.GetRow(databaseID, "subscriptions", subscriptionId)
	if err != nil {
		return
	}
	var sm map[string]interface{}
	if s.Decode(&sm) != nil {
		return
	}
	strategy, _ := sm["billingStrategy"].(string)
	if strategy != "NATIVE_RECURRING" {
		return
	}
	provider, _ := sm["provider"].(string)
	providerSubscriptionId, _ := sm["providerSubscriptionId"].(string)
	if providerSubscriptionId == "" {
		return
	}
	if provider == "NOWPAYMENTS" {
		cancelNowpaymentsSubscription(ctx, cl, providerSubscriptionId)
		return
	}
	adapter := newProviderAdapter(provider, os.Getenv("STRIPE_SECRET_KEY"))
	if err := adapter.CancelSubscription(providerSubscriptionId); err != nil {
		ctx.Error("native subscription cancel failed", "provider="+provider, err)
	}
}

// cancelNowpaymentsSubscription delegates a NOWPayments subscription cancel to
// the nowpayments function.
func cancelNowpaymentsSubscription(ctx openruntimes.Context, cl client.Client, providerSubscriptionId string) {
	npInput := map[string]interface{}{
		"operation": "cancel_subscription",
		"input":     map[string]interface{}{"providerSubscriptionId": providerSubscriptionId},
	}
	service := functions.New(cl)
	if _, err := service.CreateExecution("nowpayments",
		service.WithCreateExecutionBody(mustJSON(npInput)),
		service.WithCreateExecutionMethod("POST"),
	); err != nil {
		ctx.Error("nowpayments subscription cancel delegation failed", err)
	}
}

func subscriptionPause(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		SubscriptionId string `json:"subscriptionId"`
	}
	if !decode(ctx, in, &input) || input.SubscriptionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "subscriptions", input.SubscriptionId, map[string]interface{}{"status": "PAUSED", "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "subscriptions.subscription_pause.v1", input.SubscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": input.SubscriptionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"subscriptionId": input.SubscriptionId})
}

func subscriptionResume(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		SubscriptionId string `json:"subscriptionId"`
	}
	if !decode(ctx, in, &input) || input.SubscriptionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "subscriptions", input.SubscriptionId, map[string]interface{}{"status": "ACTIVE", "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "subscriptions.subscription_resume.v1", input.SubscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": input.SubscriptionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"subscriptionId": input.SubscriptionId})
}

func subscriptionChangePlan(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		SubscriptionId string `json:"subscriptionId"`
		PlanId         string `json:"planId"`
		PlanVersion    int    `json:"planVersion"`
	}
	if !decode(ctx, in, &input) || input.SubscriptionId == "" || input.PlanId == "" || input.PlanVersion == 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "subscriptions", input.SubscriptionId, map[string]interface{}{"planId": input.PlanId, "planVersion": input.PlanVersion, "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "subscriptions.subscription_change_plan.v1", input.SubscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": input.SubscriptionId, "planId": input.PlanId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"subscriptionId": input.SubscriptionId})
}

func subscriptionRenew(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		SubscriptionId string `json:"subscriptionId"`
	}
	if !decode(ctx, in, &input) || input.SubscriptionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "subscriptions", input.SubscriptionId, map[string]interface{}{"updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "subscriptions.subscription_renew.v1", input.SubscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": input.SubscriptionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"subscriptionId": input.SubscriptionId})
}

func subscriptionReconcile(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		SubscriptionId         string  `json:"subscriptionId"`
		ProviderSubscriptionId *string `json:"providerSubscriptionId"`
		Status                 *string `json:"status"`
	}
	if !decode(ctx, in, &input) || input.SubscriptionId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	data := map[string]interface{}{"updatedAt": now()}
	if input.ProviderSubscriptionId != nil {
		data["providerSubscriptionId"] = *input.ProviderSubscriptionId
	}
	if input.Status != nil {
		data["status"] = *input.Status
	}
	if err := updateRow(cl, "subscriptions", input.SubscriptionId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "subscriptions.subscription_reconcile.v1", input.SubscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": input.SubscriptionId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"subscriptionId": input.SubscriptionId})
}

// --- payment handlers ---

func paymentCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		UserId         string  `json:"userId"`
		Amount         int     `json:"amount"`
		Currency       string  `json:"currency"`
		Provider       string  `json:"provider"`
		PayCurrency    string  `json:"payCurrency"`
		SubscriptionId *string `json:"subscriptionId"`
	}
	if !decode(ctx, in, &input) || input.UserId == "" || input.Amount <= 0 || input.Currency == "" || input.Provider == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}

	// NOWPAYMENTS is implemented in the TypeScript nowpayments function (the SDK
	// has no Go equivalent). Delegate the whole flow — the nowpayments function
	// writes the payments row itself, so we must not create a duplicate row here.
	if input.Provider == "NOWPAYMENTS" {
		return delegateToNowpayments(ctx, in, cl, input.UserId, input.Amount, input.Currency, input.PayCurrency)
	}

	paymentId := idOrUUID(in.IdempotencyKey)
	now := now()
	row := map[string]interface{}{
		"userId": input.UserId, "amount": input.Amount, "currency": input.Currency, "provider": input.Provider,
		"status": "CREATED", "idempotencyKey": paymentId, "createdAt": now, "updatedAt": now,
	}
	if input.SubscriptionId != nil {
		row["subscriptionId"] = *input.SubscriptionId
	}
	if err := createRow(cl, "payments", paymentId, row); err != nil {
		return internalFailure(ctx, in, err)
	}

	// Provider dispatch (PaymentService abstraction — domain code never touches
	// the provider SDK; adapters isolate it). STRIPE creates a PaymentIntent.
	// Unsupported providers fail safely rather than recording an uncharged payment.
	if input.Provider == "STRIPE" && os.Getenv("STRIPE_SECRET_KEY") == "" {
		updateRow(cl, "payments", paymentId, map[string]interface{}{"status": "FAILED", "updatedAt": now})
		return respond(ctx, in.OperationId, "PROVIDER_UNCONFIGURED", false)
	}
	adapter := newProviderAdapter(input.Provider, os.Getenv("STRIPE_SECRET_KEY"))
	providerPaymentId, err := adapter.CreatePayment(context.Background(), input.UserId, paymentId, input.Amount, input.Currency)
	if err != nil {
		ctx.Error("provider create payment failed", "provider="+input.Provider, err)
		updateRow(cl, "payments", paymentId, map[string]interface{}{"status": "FAILED", "updatedAt": now})
		return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
	}
	updateRow(cl, "payments", paymentId, map[string]interface{}{"providerPaymentId": providerPaymentId, "status": "AWAITING_PROVIDER", "updatedAt": now})

	emit(ctx, cl, "payments.payment_create.v1", paymentId, actorOrEmpty(in.ActorId), map[string]interface{}{"paymentId": paymentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"paymentId": paymentId})
}

// delegateToNowpayments forwards a NOWPAYMENTS payment creation to the
// TypeScript nowpayments function (the NOWPayments SDK has no Go equivalent).
// The nowpayments function writes the payments row and returns the deposit
// details; we surface its result directly.
func delegateToNowpayments(ctx openruntimes.Context, in *GatewayInput, cl client.Client, userId string, amountMinor int, currency, payCurrency string) openruntimes.Response {
	paymentId := idOrUUID(in.IdempotencyKey)
	npInput := map[string]interface{}{
		"operation": "create_payment",
		"input": map[string]interface{}{
			"userId":      userId,
			"amount":      float64(amountMinor) / 100.0,
			"currency":    strings.ToLower(currency),
			"payCurrency": payCurrency,
			"paymentId":   paymentId,
		},
	}
	service := functions.New(cl)
	exec, err := service.CreateExecution("nowpayments",
		service.WithCreateExecutionBody(mustJSON(npInput)),
		service.WithCreateExecutionMethod("POST"),
	)
	if err != nil {
		ctx.Error("nowpayments delegation failed", err)
		return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
	}
	if exec.Status == "failed" || exec.ResponseStatusCode >= 400 {
		ctx.Error("nowpayments execution failed", "errors="+exec.Errors, "body="+exec.ResponseBody)
		return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
	}
	var npResp struct {
		Status string                 `json:"status"`
		Result map[string]interface{} `json:"result"`
	}
	if err := json.Unmarshal([]byte(exec.ResponseBody), &npResp); err != nil || npResp.Status != "SUCCESS" {
		ctx.Error("nowpayments bad response", "body="+exec.ResponseBody)
		return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
	}
	emit(ctx, cl, "payments.payment_create.v1", paymentId, actorOrEmpty(in.ActorId), map[string]interface{}{"paymentId": paymentId, "provider": "NOWPAYMENTS"}, in.CorrelationId)
	return success(ctx, in, npResp.Result)
}

// delegateToNowpaymentsSubscription forwards a NOWPAYMENTS native subscription
// creation to the TypeScript nowpayments function. The gateway has already
// created the subscriptions row; the nowpayments function creates the
// NOWPayments plan/subscription and updates the row in place.
func delegateToNowpaymentsSubscription(ctx openruntimes.Context, in *GatewayInput, cl client.Client, subscriptionId, userId, email, planId string, amount int, currency, interval string) openruntimes.Response {
	npInput := map[string]interface{}{
		"operation": "create_subscription",
		"input": map[string]interface{}{
			"userId":         userId,
			"subscriptionId": subscriptionId,
			"email":          email,
			"planId":         planId,
			"amount":         float64(amount) / 100.0,
			"currency":       strings.ToLower(currency),
			"interval":       strings.ToLower(interval),
		},
	}
	service := functions.New(cl)
	exec, err := service.CreateExecution("nowpayments",
		service.WithCreateExecutionBody(mustJSON(npInput)),
		service.WithCreateExecutionMethod("POST"),
	)
	if err != nil {
		ctx.Error("nowpayments subscription delegation failed", err)
		updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"status": "FAILED", "updatedAt": now()})
		return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
	}
	if exec.Status == "failed" || exec.ResponseStatusCode >= 400 {
		ctx.Error("nowpayments subscription execution failed", "errors="+exec.Errors, "body="+exec.ResponseBody)
		updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"status": "FAILED", "updatedAt": now()})
		return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
	}
	var npResp struct {
		Status string                 `json:"status"`
		Result map[string]interface{} `json:"result"`
	}
	if err := json.Unmarshal([]byte(exec.ResponseBody), &npResp); err != nil || npResp.Status != "SUCCESS" {
		ctx.Error("nowpayments subscription bad response", "body="+exec.ResponseBody)
		updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"status": "FAILED", "updatedAt": now()})
		return respond(ctx, in.OperationId, "PROVIDER_ERROR", true)
	}
	emit(ctx, cl, "subscriptions.subscription_create.v1", subscriptionId, actorOrEmpty(in.ActorId), map[string]interface{}{"subscriptionId": subscriptionId, "provider": "NOWPAYMENTS"}, in.CorrelationId)
	return success(ctx, in, npResp.Result)
}

func paymentConfirmFromWebhook(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		Provider        string  `json:"provider"`
		Payload         string  `json:"payload"`
		SignatureHeader string  `json:"signatureHeader"`
		ProviderEventId string  `json:"providerEventId"`
		PaymentId       *string `json:"paymentId"`
		EventType       string  `json:"eventType"`
	}
	if !decode(ctx, in, &input) || input.Provider == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}

	eventType := input.EventType
	providerEventId := input.ProviderEventId
	signatureVerified := false

	// STRIPE: verify the webhook signature server-side; the verified
	// event type + ID are authoritative (never trust client-supplied values).
	if input.Provider == "STRIPE" {
		secret := os.Getenv("STRIPE_WEBHOOK_SECRET")
		if secret == "" {
			return respond(ctx, in.OperationId, "PROVIDER_UNCONFIGURED", false)
		}
		verifiedType, verifiedID, err := verifyStripeWebhook([]byte(input.Payload), input.SignatureHeader, secret)
		if err != nil {
			return respond(ctx, in.OperationId, "SIGNATURE_VERIFICATION_FAILED", false)
		}
		eventType = verifiedType
		providerEventId = verifiedID
		signatureVerified = true
	}

	if providerEventId == "" || eventType == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}

	// Deduplicate on providerEventId: the event row ID is the provider event ID.
	ts := now()
	eventRow := map[string]interface{}{
		"provider": input.Provider, "providerEventId": providerEventId,
		"eventType": eventType, "receivedAt": ts, "signatureVerified": signatureVerified,
		"processingState": "RECEIVED", "processingAttempts": 0, "createdAt": ts,
	}
	if input.PaymentId != nil {
		eventRow["paymentId"] = *input.PaymentId
	}
	if err := createRow(cl, "payment_events", providerEventId, eventRow); err != nil {
		// Duplicate event is harmless per the contract.
		ctx.Log("payment_confirm_from_webhook: duplicate event", "providerEventId="+providerEventId)
	}
	if input.PaymentId != nil && *input.PaymentId != "" {
		if err := updateRow(cl, "payments", *input.PaymentId, map[string]interface{}{"status": "CAPTURED", "updatedAt": now()}); err != nil {
			ctx.Error("payment_confirm_from_webhook: payment update failed", err)
		}
		activateSubscriptionForPayment(cl, *input.PaymentId)
	}
	emit(ctx, cl, "payments.payment_confirm_from_webhook.v1", providerEventId, actorOrEmpty(in.ActorId), map[string]interface{}{"providerEventId": providerEventId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"eventId": providerEventId})
}

// handleStripeWebhook handles the raw Stripe webhook endpoint (/webhooks/stripe).
// It verifies the signature server-side and records the event; if the event
// carries a StoryGalore paymentId (via object metadata), it marks the payment CAPTURED.
func handleStripeWebhook(ctx openruntimes.Context, cl client.Client) openruntimes.Response {
	payload := ctx.Req.BodyText()
	sigHeader := ctx.Req.Headers["stripe-signature"]
	ctx.Log("stripe webhook", "hasSignatureHeader="+fmtBool(sigHeader != ""))
	if payload == "" || sigHeader == "" {
		return ctx.Res.Json(map[string]interface{}{"error": "MISSING_PAYLOAD_OR_SIGNATURE"}, ctx.Res.WithStatusCode(400))
	}
	secret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if secret == "" {
		return ctx.Res.Json(map[string]interface{}{"error": "PROVIDER_UNCONFIGURED"}, ctx.Res.WithStatusCode(400))
	}
	eventType, eventID, err := verifyStripeWebhook([]byte(payload), sigHeader, secret)
	if err != nil {
		ctx.Log("stripe webhook verify failed", "err="+err.Error())
		return ctx.Res.Json(map[string]interface{}{"error": "SIGNATURE_VERIFICATION_FAILED"}, ctx.Res.WithStatusCode(400))
	}

	paymentId := extractStripePaymentId(payload)
	ts := now()
	eventRow := map[string]interface{}{
		"provider": "STRIPE", "providerEventId": eventID, "eventType": eventType,
		"receivedAt": ts, "signatureVerified": true, "processingState": "RECEIVED",
		"processingAttempts": 0, "createdAt": ts,
	}
	if paymentId != "" {
		eventRow["paymentId"] = paymentId
	}
	if err := createRow(cl, "payment_events", eventID, eventRow); err != nil {
		ctx.Log("stripe webhook: duplicate event", "eventId="+eventID)
	}
	if paymentId != "" {
		if err := updateRow(cl, "payments", paymentId, map[string]interface{}{"status": "CAPTURED", "updatedAt": now()}); err != nil {
			ctx.Error("stripe webhook: payment update failed", err)
		}
		activateSubscriptionForPayment(cl, paymentId)
	}

	// Native subscription events (customer.subscription.*) drive the
	// subscriptions.status for NATIVE_RECURRING.
	if subscriptionId, stripeStatus := extractStripeSubscription(payload); subscriptionId != "" {
		transitionSubscriptionStatus(cl, subscriptionId, mapStripeSubscriptionStatus(stripeStatus))
	}

	return ctx.Res.Json(map[string]interface{}{"received": true, "eventId": eventID})
}

// transitionSubscriptionStatus updates a subscription's status, guarding against
// regression from a terminal state (CANCELLED/EXPIRED) back to ACTIVE. It is
// the shared idempotent transition used by the Stripe subscription webhook.
func transitionSubscriptionStatus(cl client.Client, subscriptionId, newStatus string) {
	service := tablesdb.New(cl)
	s, err := service.GetRow(databaseID, "subscriptions", subscriptionId)
	if err != nil {
		return
	}
	var sm map[string]interface{}
	if s.Decode(&sm) != nil {
		return
	}
	current, _ := sm["status"].(string)
	if current == newStatus {
		return
	}
	if (current == "CANCELLED" || current == "EXPIRED") && newStatus == "ACTIVE" {
		return
	}
	if err := updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"status": newStatus, "updatedAt": now()}); err != nil {
		// best-effort; retried on the next (idempotent) webhook.
	}
}

// extractStripeSubscription extracts the StoryGalore subscriptionId and the
// Stripe subscription status from a customer.subscription.* event.
func extractStripeSubscription(payload string) (subscriptionId, stripeStatus string) {
	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(payload), &raw); err != nil {
		return "", ""
	}
	data, _ := raw["data"].(map[string]interface{})
	object, _ := data["object"].(map[string]interface{})
	metadata, _ := object["metadata"].(map[string]interface{})
	subscriptionId, _ = metadata["subscriptionId"].(string)
	stripeStatus, _ = object["status"].(string)
	return subscriptionId, stripeStatus
}

// mapStripeSubscriptionStatus maps a Stripe subscription status to the
// StoryGalore subscriptions.status enum.
func mapStripeSubscriptionStatus(stripeStatus string) string {
	switch stripeStatus {
	case "active", "trialing":
		return "ACTIVE"
	case "past_due", "unpaid":
		return "PAST_DUE"
	case "canceled":
		return "CANCELLED"
	case "incomplete_expired":
		return "EXPIRED"
	default:
		return "AWAITING_PROVIDER"
	}
}

// activateSubscriptionForPayment transitions a subscription to ACTIVE when its
// linked payment is captured. This is the MERCHANT_MANAGED activation path;
// NATIVE_RECURRING subscriptions are driven by the provider's own subscription
// webhook. Idempotent: only non-terminal states are transitioned, so duplicate
// or out-of-order webhooks never corrupt subscription state.
func activateSubscriptionForPayment(cl client.Client, paymentId string) {
	service := tablesdb.New(cl)
	p, err := service.GetRow(databaseID, "payments", paymentId)
	if err != nil {
		return
	}
	var pm map[string]interface{}
	if p.Decode(&pm) != nil {
		return
	}
	subscriptionId, _ := pm["subscriptionId"].(string)
	if subscriptionId == "" {
		return
	}
	s, err := service.GetRow(databaseID, "subscriptions", subscriptionId)
	if err != nil {
		return
	}
	var sm map[string]interface{}
	if s.Decode(&sm) != nil {
		return
	}
	status, _ := sm["status"].(string)
	switch status {
	case "CREATED", "CHECKOUT_STARTED", "AWAITING_PROVIDER":
		if err := updateRow(cl, "subscriptions", subscriptionId, map[string]interface{}{"status": "ACTIVE", "updatedAt": now()}); err != nil {
			// Best-effort; the activation is retried on the next (idempotent) webhook.
		}
	}
}

// extractStripePaymentId extracts the StoryGalore paymentId from the event's
// object metadata (set by the Stripe adapter at PaymentIntent creation).
func extractStripePaymentId(payload string) string {
	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(payload), &raw); err != nil {
		return ""
	}
	data, _ := raw["data"].(map[string]interface{})
	object, _ := data["object"].(map[string]interface{})
	metadata, _ := object["metadata"].(map[string]interface{})
	paymentId, _ := metadata["paymentId"].(string)
	return paymentId
}

func paymentRefund(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PaymentId string  `json:"paymentId"`
		Amount    int     `json:"amount"`
		Reason    *string `json:"reason"`
	}
	if !decode(ctx, in, &input) || input.PaymentId == "" || input.Amount <= 0 {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	refundId := idOrUUID(in.IdempotencyKey)
	row := map[string]interface{}{
		"paymentId": input.PaymentId, "amount": input.Amount, "currency": "USD", "status": "REQUESTED", "createdAt": now(),
	}
	if input.Reason != nil {
		row["reason"] = *input.Reason
	}
	if err := createRow(cl, "refunds", refundId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	if err := updateRow(cl, "payments", input.PaymentId, map[string]interface{}{"status": "REFUNDED", "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "payments.payment_refund.v1", input.PaymentId, actorOrEmpty(in.ActorId), map[string]interface{}{"paymentId": input.PaymentId, "refundId": refundId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"refundId": refundId})
}

func paymentReconcile(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PaymentId         string  `json:"paymentId"`
		ProviderPaymentId *string `json:"providerPaymentId"`
		Status            *string `json:"status"`
	}
	if !decode(ctx, in, &input) || input.PaymentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	data := map[string]interface{}{"updatedAt": now()}
	if input.ProviderPaymentId != nil {
		data["providerPaymentId"] = *input.ProviderPaymentId
	}
	if input.Status != nil {
		data["status"] = *input.Status
	}
	if err := updateRow(cl, "payments", input.PaymentId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "payments.payment_reconcile.v1", input.PaymentId, actorOrEmpty(in.ActorId), map[string]interface{}{"paymentId": input.PaymentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"paymentId": input.PaymentId})
}

func paymentMarkFailed(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PaymentId string `json:"paymentId"`
	}
	if !decode(ctx, in, &input) || input.PaymentId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	if err := updateRow(cl, "payments", input.PaymentId, map[string]interface{}{"status": "FAILED", "updatedAt": now()}); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "payments.payment_mark_failed.v1", input.PaymentId, actorOrEmpty(in.ActorId), map[string]interface{}{"paymentId": input.PaymentId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"paymentId": input.PaymentId})
}

// --- reader handlers ---

func qEqual(attr, value string) string {
	v, _ := json.Marshal(value)
	return `{"method":"equal","attribute":"` + attr + `","values":[` + string(v) + `]}`
}

func nextVersion(existing map[string]interface{}) int {
	if v, ok := existing["version"].(float64); ok {
		return int(v) + 1
	}
	return 1
}

func findReadingProgress(cl client.Client, userId, publicationId, episodeId string) (string, map[string]interface{}, error) {
	service := tablesdb.New(cl)
	queries := []string{qEqual("userId", userId), qEqual("publicationId", publicationId)}
	if episodeId != "" {
		queries = append(queries, qEqual("episodeId", episodeId))
	}
	queries = append(queries, `{"method":"limit","values":[1]}`)
	list, err := service.ListRows(databaseID, "reading_progress", service.WithListRowsQueries(queries))
	if err != nil {
		return "", nil, err
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return "", nil, err
	}
	rows, ok := raw["rows"].([]interface{})
	if !ok || len(rows) == 0 {
		return "", nil, nil
	}
	first, ok := rows[0].(map[string]interface{})
	if !ok {
		return "", nil, nil
	}
	id, _ := first["$id"].(string)
	return id, first, nil
}

func readingProgressUpsert(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PublicationId   string `json:"publicationId"`
		EpisodeId       string `json:"episodeId"`
		PageId          string `json:"pageId"`
		Position        *int   `json:"position"`
		PercentComplete *int   `json:"percentComplete"`
	}
	if !decode(ctx, in, &input) || input.PublicationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	userId := actorOrEmpty(in.ActorId)
	if userId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}

	progressId, existing, err := findReadingProgress(cl, userId, input.PublicationId, input.EpisodeId)
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	now := now()
	data := map[string]interface{}{"lastAccessedAt": now, "updatedAt": now}
	if input.PageId != "" {
		data["pageId"] = input.PageId
	}
	if input.Position != nil {
		data["position"] = *input.Position
	}
	if input.PercentComplete != nil {
		data["percentComplete"] = *input.PercentComplete
	}

	if progressId == "" {
		progressId = idOrUUID(in.IdempotencyKey)
		data["userId"] = userId
		data["publicationId"] = input.PublicationId
		data["status"] = "IN_PROGRESS"
		data["startedAt"] = now
		data["version"] = 1
		data["createdAt"] = now
		if input.EpisodeId != "" {
			data["episodeId"] = input.EpisodeId
		}
		if err := createRow(cl, "reading_progress", progressId, data); err != nil {
			return internalFailure(ctx, in, err)
		}
	} else {
		data["version"] = nextVersion(existing)
		if err := updateRow(cl, "reading_progress", progressId, data); err != nil {
			return internalFailure(ctx, in, err)
		}
	}
	emit(ctx, cl, "reader.reading_progress_upsert.v1", progressId, actorOrEmpty(in.ActorId), map[string]interface{}{"readingProgressId": progressId, "publicationId": input.PublicationId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"readingProgressId": progressId})
}

func readingProgressComplete(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PublicationId string `json:"publicationId"`
		EpisodeId     string `json:"episodeId"`
	}
	if !decode(ctx, in, &input) || input.PublicationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	userId := actorOrEmpty(in.ActorId)
	if userId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	progressId, existing, err := findReadingProgress(cl, userId, input.PublicationId, input.EpisodeId)
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	if progressId == "" {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	now := now()
	data := map[string]interface{}{
		"status": "COMPLETED", "percentComplete": 100, "completedAt": now,
		"lastAccessedAt": now, "updatedAt": now, "version": nextVersion(existing),
	}
	if err := updateRow(cl, "reading_progress", progressId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "reader.reading_progress_complete.v1", progressId, actorOrEmpty(in.ActorId), map[string]interface{}{"readingProgressId": progressId, "publicationId": input.PublicationId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"readingProgressId": progressId})
}

func readingProgressGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PublicationId string `json:"publicationId"`
		EpisodeId     string `json:"episodeId"`
	}
	if !decode(ctx, in, &input) || input.PublicationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	userId := actorOrEmpty(in.ActorId)
	if userId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	_, row, err := findReadingProgress(cl, userId, input.PublicationId, input.EpisodeId)
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	if row == nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	return success(ctx, in, row)
}

func resolveCoverURL(cl client.Client, publicationId string) string {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "media_assets", service.WithListRowsQueries([]string{
		qEqual("publicationId", publicationId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return ""
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return ""
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return ""
	}
	asset, _ := rows[0].(map[string]interface{})
	bucket, _ := asset["originBucketKey"].(string)
	fileId, _ := asset["originFileId"].(string)
	if bucket == "" || fileId == "" {
		return ""
	}
	return buildPreviewURL(bucket, fileId, 400)
}

// publicMediaEndpoint resolves the browser-facing origin for media URLs. It
// prefers an explicit public media endpoint (HTTPS, CDN-fronted) so the browser
// never receives the function's internal origin (e.g. a raw IP over HTTP).
func publicMediaEndpoint() string {
	if e := os.Getenv("PUBLIC_MEDIA_ENDPOINT"); e != "" {
		return e
	}
	if e := os.Getenv("APPWRITE_ENDPOINT"); e != "" {
		return e
	}
	return os.Getenv("APPWRITE_FUNCTION_API_ENDPOINT")
}

func buildPreviewURL(bucket, fileId string, dims ...int) string {
	endpoint := publicMediaEndpoint()
	u := endpoint + "/storage/buckets/" + bucket + "/files/" + fileId + "/preview?project=" + os.Getenv("APPWRITE_FUNCTION_PROJECT_ID")
	if len(dims) >= 1 && dims[0] > 0 {
		u += fmt.Sprintf("&width=%d", dims[0])
		if len(dims) >= 2 && dims[1] > 0 {
			u += fmt.Sprintf("&height=%d", dims[1])
		}
	}
	return u
}

// resolveDeliveryURL issues a short-lived Appwrite file token and returns a
// tokenized preview URL (on-the-fly variant) for protected media. The origin
// bucket/file identifiers are only reachable through the expiring token, never
// as a permanent public URL.
func resolveDeliveryURL(cl client.Client, bucket, fileId string, ttl time.Duration, dims ...int) string {
	expire := time.Now().UTC().Add(ttl).Format(time.RFC3339)
	t := tokens.New(cl)
	token, err := t.CreateFileToken(bucket, fileId, t.WithCreateFileTokenExpire(expire))
	if err != nil || token.Secret == "" {
		return ""
	}
	endpoint := publicMediaEndpoint()
	project := os.Getenv("APPWRITE_FUNCTION_PROJECT_ID")
	u := endpoint + "/storage/buckets/" + bucket + "/files/" + fileId + "/preview?token=" + token.Secret + "&project=" + project
	if len(dims) >= 1 && dims[0] > 0 {
		u += fmt.Sprintf("&width=%d", dims[0])
		if len(dims) >= 2 && dims[1] > 0 {
			u += fmt.Sprintf("&height=%d", dims[1])
		}
	}
	return u
}

func resolveCreatorName(cl client.Client, creatorId string) string {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "creators", service.WithListRowsQueries([]string{
		qEqual("actorId", creatorId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return ""
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return ""
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return ""
	}
	creator, _ := rows[0].(map[string]interface{})
	name, _ := creator["displayName"].(string)
	return name
}

func continueList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	userId := actorOrEmpty(in.ActorId)
	if userId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	queries := []string{
		qEqual("userId", userId),
		qEqual("status", "IN_PROGRESS"),
		`{"method":"orderDesc","attribute":"lastAccessedAt"}`,
		`{"method":"limit","values":[20]}`,
	}
	list, err := service.ListRows(databaseID, "reading_progress", service.WithListRowsQueries(queries))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	items := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		row, _ := r.(map[string]interface{})
		item := map[string]interface{}{"progress": row}
		if pubId, ok := row["publicationId"].(string); ok && pubId != "" {
			if pub, err := service.GetRow(databaseID, "publications", pubId); err == nil {
				var pm map[string]interface{}
				if pub.Decode(&pm) == nil {
					item["publication"] = pm
					if creatorId, ok := pm["creatorId"].(string); ok && creatorId != "" {
						item["creatorName"] = resolveCreatorName(cl, creatorId)
					}
				}
			}
			item["coverUrl"] = resolveCoverURL(cl, pubId)
		}
		items = append(items, item)
	}
	return success(ctx, in, map[string]interface{}{"items": items})
}

func publicationList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		Sort      string `json:"sort"`
		CreatorId string `json:"creatorId"`
		Type      string `json:"type"`
		Format    string `json:"format"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	sortAttr := "publishedAt"
	if input.Sort == "new" {
		sortAttr = "createdAt"
	}
	service := tablesdb.New(cl)
	queries := []string{
		qEqual("status", "PUBLISHED"),
	}
	if input.CreatorId != "" {
		queries = append(queries, qEqual("creatorId", input.CreatorId))
	}
	if input.Type != "" {
		queries = append(queries, qEqual("type", input.Type))
	}
	if input.Format != "" {
		queries = append(queries, qEqual("format", input.Format))
	}
	queries = append(queries,
		`{"method":"orderDesc","attribute":"`+sortAttr+`"}`,
		`{"method":"limit","values":[20]}`,
	)
	list, err := service.ListRows(databaseID, "publications", service.WithListRowsQueries(queries))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	items := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		row, _ := r.(map[string]interface{})
		item := map[string]interface{}{"publication": row}
		if pubId, ok := row["$id"].(string); ok && pubId != "" {
			item["coverUrl"] = resolveCoverURL(cl, pubId)
			if creatorId, ok := row["creatorId"].(string); ok && creatorId != "" {
				item["creatorName"] = resolveCreatorName(cl, creatorId)
			}
		}
		items = append(items, item)
	}
	return success(ctx, in, map[string]interface{}{"items": items})
}

func publicationGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PublicationId string `json:"publicationId"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	if input.PublicationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	pub, err := service.GetRow(databaseID, "publications", input.PublicationId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var pm map[string]interface{}
	if err := pub.Decode(&pm); err != nil {
		return internalFailure(ctx, in, err)
	}
	if status, _ := pm["status"].(string); status != "PUBLISHED" && status != "APPROVED" {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	accessClass, _ := pm["accessClass"].(string)
	entitled := true
	if accessClass == "SUBSCRIPTION" || accessClass == "PURCHASE" {
		var pd deliveryDecision
		entitled = entitlementSatisfied(cl, actorId, pm, &pd)
	}
	pubType, _ := pm["type"].(string)
	action := "VIEW"
	if pubType == "VIDEO" || pubType == "AUDIO" {
		action = "STREAM"
	}
	media := make([]map[string]interface{}, 0)
	for _, assetId := range stringSlice(pm["mediaAssetIds"]) {
		decision := authorizeMediaDelivery(cl, assetId, action, actorId)
		entry := map[string]interface{}{"mediaId": assetId, "allowed": decision.Allowed}
		if decision.Allowed {
			entry["url"] = decision.URL
		}
		media = append(media, entry)
	}
	out := map[string]interface{}{
		"publication": pm,
		"media":       media,
		"entitled":    entitled,
		"accessClass": accessClass,
		"coverUrl":    resolveCoverURL(cl, input.PublicationId),
	}
	if creatorId, ok := pm["creatorId"].(string); ok && creatorId != "" {
		out["creatorName"] = resolveCreatorName(cl, creatorId)
	}
	return success(ctx, in, out)
}

func supportTicketCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		Subject string `json:"subject"`
		Message string `json:"message"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	if input.Subject == "" || input.Message == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	rowId := newUUID()
	nowStr := now()
	row := map[string]interface{}{
		"userId":    actorId,
		"subject":   input.Subject,
		"message":   input.Message,
		"status":    "OPEN",
		"createdAt": nowStr,
		"updatedAt": nowStr,
	}
	if err := createRow(cl, "support_tickets", rowId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, map[string]interface{}{"ticketId": rowId})
}

func supportTicketList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "support_tickets", service.WithListRowsQueries([]string{
		qEqual("userId", actorId),
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[100]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func supportTicketGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		TicketId string `json:"ticketId"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" || input.TicketId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, "support_tickets", input.TicketId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var m map[string]interface{}
	if err := row.Decode(&m); err != nil {
		return internalFailure(ctx, in, err)
	}
	if uid, _ := m["userId"].(string); uid != actorId {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	return success(ctx, in, m)
}

func creatorList(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	service := tablesdb.New(cl)
	queries := []string{
		qEqual("creatorStatus", "ACTIVE"),
		`{"method":"orderDesc","attribute":"createdAt"}`,
		`{"method":"limit","values":[20]}`,
	}
	list, err := service.ListRows(databaseID, "creators", service.WithListRowsQueries(queries))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	return success(ctx, in, map[string]interface{}{"items": rows})
}

func creatorGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ActorId string `json:"actorId"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	if input.ActorId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "creators", service.WithListRowsQueries([]string{
		qEqual("actorId", input.ActorId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	return success(ctx, in, rows[0])
}

func creatorCreate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		Handle      string `json:"handle"`
		DisplayName string `json:"displayName"`
		Bio         string `json:"bio"`
	}
	if !decode(ctx, in, &input) || input.Handle == "" || input.DisplayName == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	userId := actorOrEmpty(in.ActorId)
	if userId == "" {
		return respond(ctx, in.OperationId, "UNAUTHORIZED", false)
	}
	service := tablesdb.New(cl)
	existing, err := service.ListRows(databaseID, "creators", service.WithListRowsQueries([]string{
		qEqual("actorId", userId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var existingRaw map[string]interface{}
	if existing.Decode(&existingRaw) == nil {
		if rows, ok := existingRaw["rows"].([]interface{}); ok && len(rows) > 0 {
			return respond(ctx, in.OperationId, "CONFLICT", false)
		}
	}
	now := now()
	row := map[string]interface{}{
		"actorId": userId, "handle": input.Handle, "displayName": input.DisplayName,
		"creatorStatus": "ACTIVE", "verificationStatus": "UNVERIFIED", "followerCountProjection": 0,
		"createdAt": now, "updatedAt": now,
	}
	if input.Bio != "" {
		row["bio"] = input.Bio
	}
	creatorId := idOrUUID(in.IdempotencyKey)
	if err := createRow(cl, "creators", creatorId, row); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "social.creator_create.v1", creatorId, actorOrEmpty(in.ActorId), map[string]interface{}{"creatorId": creatorId, "actorId": userId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"creatorId": creatorId})
}

func creatorUpdate(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		ActorId            string  `json:"actorId"`
		AvatarMediaAssetId *string `json:"avatarMediaAssetId"`
		CoverMediaAssetId  *string `json:"coverMediaAssetId"`
		DisplayName        *string `json:"displayName"`
		Bio                *string `json:"bio"`
	}
	if !decode(ctx, in, &input) || input.ActorId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	actorId := actorOrEmpty(in.ActorId)
	if actorId == "" || actorId != input.ActorId {
		return respond(ctx, in.OperationId, "FORBIDDEN", false)
	}
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, "creators", service.WithListRowsQueries([]string{
		qEqual("actorId", actorId),
		`{"method":"limit","values":[1]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var raw map[string]interface{}
	if err := list.Decode(&raw); err != nil {
		return internalFailure(ctx, in, err)
	}
	rows, _ := raw["rows"].([]interface{})
	if len(rows) == 0 {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	creator, _ := rows[0].(map[string]interface{})
	creatorId, _ := creator["$id"].(string)
	data := map[string]interface{}{"updatedAt": now()}
	if input.AvatarMediaAssetId != nil {
		data["avatarMediaAssetId"] = *input.AvatarMediaAssetId
	}
	if input.CoverMediaAssetId != nil {
		data["coverMediaAssetId"] = *input.CoverMediaAssetId
	}
	if input.DisplayName != nil {
		data["displayName"] = *input.DisplayName
	}
	if input.Bio != nil {
		data["bio"] = *input.Bio
	}
	if err := updateRow(cl, "creators", creatorId, data); err != nil {
		return internalFailure(ctx, in, err)
	}
	emit(ctx, cl, "social.creator_update.v1", creatorId, actorOrEmpty(in.ActorId), map[string]interface{}{"creatorId": creatorId, "actorId": actorId}, in.CorrelationId)
	return success(ctx, in, map[string]interface{}{"creatorId": creatorId})
}

func readerManifestGet(ctx openruntimes.Context, in *GatewayInput, cl client.Client) openruntimes.Response {
	var input struct {
		PublicationId string `json:"publicationId"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	if input.PublicationId == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	pub, err := service.GetRow(databaseID, "publications", input.PublicationId)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var pm map[string]interface{}
	if err := pub.Decode(&pm); err != nil {
		return internalFailure(ctx, in, err)
	}
	actorId := actorOrEmpty(in.ActorId)
	if accessClass, _ := pm["accessClass"].(string); accessClass == "SUBSCRIPTION" || accessClass == "PURCHASE" {
		var pd deliveryDecision
		if !entitlementSatisfied(cl, actorId, pm, &pd) {
			return success(ctx, in, map[string]interface{}{
				"publication":        pm,
				"pages":              []interface{}{},
				"entitlementDenied":  true,
				"entitlementReasons": pd.Reasons,
				"accessClass":        accessClass,
			})
		}
	}
	pagesList, err := service.ListRows(databaseID, "book_pages", service.WithListRowsQueries([]string{
		qEqual("publicationId", input.PublicationId),
		`{"method":"orderAsc","attribute":"position"}`,
		`{"method":"limit","values":[200]}`,
	}))
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var praw map[string]interface{}
	if err := pagesList.Decode(&praw); err != nil {
		return internalFailure(ctx, in, err)
	}
	pages, _ := praw["rows"].([]interface{})
	const maxReaderWidth = 1600
	for _, p := range pages {
		page, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		if assetId, ok := page["mediaAssetId"].(string); ok && assetId != "" {
			var dims []int
			if w := toInt(page["width"]); w > maxReaderWidth {
				h := 0
				if ph := toInt(page["height"]); ph > 0 {
					h = ph * maxReaderWidth / w
				}
				dims = []int{maxReaderWidth, h}
			}
			decision := authorizeMediaDelivery(cl, assetId, "VIEW", actorId, dims...)
			if decision.Allowed {
				page["url"] = decision.URL
				page["accessClass"] = decision.AccessClass
			} else {
				page["denied"] = true
				page["deniedReasons"] = decision.Reasons
			}
		}
	}
	return success(ctx, in, map[string]interface{}{
		"publication": pm,
		"pages":       pages,
	})
}

// --- query helpers ---

func getRow(ctx openruntimes.Context, in *GatewayInput, cl client.Client, table string) openruntimes.Response {
	var input struct {
		Id string `json:"id"`
	}
	_ = json.Unmarshal(in.Payload.Input, &input)
	// determine id field from table
	id := input.Id
	if id == "" {
		id = firstID(in.Payload.Input)
	}
	if id == "" {
		return respond(ctx, in.OperationId, "INVALID_INPUT", false)
	}
	service := tablesdb.New(cl)
	row, err := service.GetRow(databaseID, table, id)
	if err != nil {
		return respond(ctx, in.OperationId, "RESOURCE_NOT_FOUND", false)
	}
	var m map[string]interface{}
	if err := row.Decode(&m); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, m)
}

func listRows(ctx openruntimes.Context, in *GatewayInput, cl client.Client, table string) openruntimes.Response {
	service := tablesdb.New(cl)
	list, err := service.ListRows(databaseID, table)
	if err != nil {
		return internalFailure(ctx, in, err)
	}
	var m map[string]interface{}
	if err := list.Decode(&m); err != nil {
		return internalFailure(ctx, in, err)
	}
	return success(ctx, in, m)
}

// --- helpers ---

func decode(ctx openruntimes.Context, in *GatewayInput, v interface{}) bool {
	if err := json.Unmarshal(in.Payload.Input, v); err != nil {
		ctx.Error("api: invalid input", err)
		return false
	}
	return true
}

func createRow(cl client.Client, table, id string, data map[string]interface{}) error {
	service := tablesdb.New(cl)
	_, err := service.CreateRow(databaseID, table, id, data)
	return err
}

func updateRow(cl client.Client, table, id string, data map[string]interface{}) error {
	service := tablesdb.New(cl)
	_, err := service.UpdateRow(databaseID, table, id, service.WithUpdateRowData(data))
	return err
}

func emit(ctx openruntimes.Context, cl client.Client, eventType, aggregateId, actorId string, payload map[string]interface{}, correlationId string) {
	service := tablesdb.New(cl)
	ts := now()
	eventId := idOrUUID(nil)
	_, err := service.CreateRow(databaseID, "domain_events", eventId, map[string]interface{}{
		"eventId": eventId, "eventType": eventType, "aggregateId": aggregateId, "payload": mustJSON(payload),
		"correlationId": correlationId, "occurredAt": ts, "deliveryAttempts": 0,
	})
	if err != nil {
		ctx.Error("api: outbox emit failed", err)
	}
	// Privacy-minimized analytics projection (append-only, rebuildable from domain_events).
	props := map[string]interface{}{}
	for _, k := range []string{"type", "accessClass", "status", "planId", "provider", "format"} {
		if v, ok := payload[k]; ok {
			props[k] = v
		}
	}
	if _, err := service.CreateRow(databaseID, "analytics_events", idOrUUID(nil), map[string]interface{}{
		"eventType": eventType, "aggregateId": aggregateId, "occurredAt": ts,
		"correlationId": correlationId, "actorId": actorId, "properties": mustJSON(props),
	}); err != nil {
		ctx.Error("api: analytics projection failed", err)
	}
}

func newClient(ctx openruntimes.Context) client.Client {
	// Prefer an explicitly-configured endpoint (custom variable), then the
	// runtime's internal endpoint, then the public endpoint.
	endpoint := os.Getenv("APPWRITE_ENDPOINT")
	if endpoint == "" {
		endpoint = os.Getenv("APPWRITE_FUNCTION_API_ENDPOINT")
		if endpoint == "" || strings.Contains(endpoint, "appwrite.test") {
			endpoint = os.Getenv("APPWRITE_FUNCTION_ENDPOINT")
		}
	}

	// The runtime provides an auto-scoped key; fall back to the execution
	// key header when present.
	key := os.Getenv("APPWRITE_FUNCTION_API_KEY")
	if key == "" {
		key = ctx.Req.Headers["x-appwrite-key"]
	}

	ctx.Log("api: client config", "resolvedEndpoint="+endpoint, "hasKey="+fmtBool(key != ""))

	return appwrite.NewClient(
		appwrite.WithEndpoint(endpoint),
		appwrite.WithProject(os.Getenv("APPWRITE_FUNCTION_PROJECT_ID")),
		appwrite.WithKey(key),
	)
}

func fmtBool(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

func success(ctx openruntimes.Context, in *GatewayInput, result interface{}) openruntimes.Response {
	return ctx.Res.Json(GatewayOutput{Status: "SUCCESS", OperationId: in.OperationId, Result: result, ErrorCode: nil, Retryable: false})
}

func respond(ctx openruntimes.Context, operationId *string, code string, retryable bool) openruntimes.Response {
	return ctx.Res.Json(GatewayOutput{Status: "FAILED", OperationId: operationId, Result: nil, ErrorCode: &code, Retryable: retryable})
}

func internalFailure(ctx openruntimes.Context, in *GatewayInput, err error) openruntimes.Response {
	ctx.Error("api: internal failure", err)
	return respond(ctx, in.OperationId, "INTERNAL_FAILURE", true)
}

func idOrUUID(idempotencyKey *string) string {
	if idempotencyKey != nil && *idempotencyKey != "" {
		return *idempotencyKey
	}
	return newUUID()
}

func newUUID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format(time.RFC3339Nano)))
	}
	return hex.EncodeToString(b)
}

func firstID(raw json.RawMessage) string {
	var m map[string]interface{}
	if err := json.Unmarshal(raw, &m); err != nil {
		return ""
	}
	for _, k := range []string{"projectId", "documentId", "pageId", "requestId", "validationRunId", "validationId", "sessionId", "storyBibleId", "commentId", "planId", "subscriptionId", "paymentId", "mediaAssetId"} {
		if s, ok := m[k].(string); ok && s != "" {
			return s
		}
	}
	return ""
}

func now() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}

func mustJSON(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		return "{}"
	}
	return string(b)
}

func actorOrEmpty(actorId *string) string {
	if actorId == nil {
		return ""
	}
	return *actorId
}
