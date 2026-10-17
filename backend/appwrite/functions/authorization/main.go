package handler

import (
	"encoding/json"

	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

// Input matches contracts/functions/schemas/authorization-input.yaml.
// The payload shape is CONTRACT_SPECIFIC and not yet finalized; it is
// carried through as raw JSON.
type Input struct {
	RequestId      string          `json:"requestId"`
	CorrelationId  string          `json:"correlationId"`
	ActorId        *string         `json:"actorId"`
	OperationId    *string         `json:"operationId"`
	IdempotencyKey *string         `json:"idempotencyKey"`
	Payload        json.RawMessage `json:"payload"`
}

// Output matches contracts/functions/schemas/authorization-output.yaml.
type Output struct {
	Status      string  `json:"status"`
	OperationId *string `json:"operationId"`
	Result      any     `json:"result"`
	ErrorCode   *string `json:"errorCode"`
	Retryable   bool    `json:"retryable"`
}

const (
	// errorPolicyEngineNotImplemented is the fail-closed decision returned
	// until the Policy Engine entitlement decision contract is implemented.
	errorPolicyEngineNotImplemented = "POLICY_ENGINE_NOT_IMPLEMENTED"
	errorInvalidInput               = "INVALID_INPUT"
)

func Main(ctx openruntimes.Context) openruntimes.Response {
	ctx.Log("authorization request", "path="+ctx.Req.Path, "method="+ctx.Req.Method)

	var input Input
	if err := ctx.Req.BodyJson(&input); err != nil {
		ctx.Error("authorization: invalid input JSON", err)
		return respond(ctx, nil, errorInvalidInput, false)
	}

	if input.RequestId == "" || input.CorrelationId == "" {
		ctx.Error("authorization: missing required field requestId or correlationId")
		return respond(ctx, input.OperationId, errorInvalidInput, false)
	}

	ctx.Log(
		"authorization: policy engine not implemented; failing closed",
		"requestId="+input.RequestId,
		"correlationId="+input.CorrelationId,
	)

	// Fail closed: the Policy Engine entitlement decision logic is deferred.
	// Never return SUCCESS from this skeleton.
	return respond(ctx, input.OperationId, errorPolicyEngineNotImplemented, false)
}

func respond(ctx openruntimes.Context, operationId *string, code string, retryable bool) openruntimes.Response {
	out := Output{
		Status:      "FAILED",
		OperationId: operationId,
		Result:      nil,
		ErrorCode:   &code,
		Retryable:   retryable,
	}
	return ctx.Res.Json(out)
}
