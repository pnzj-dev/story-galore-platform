package handler

import (
	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

func Main(ctx openruntimes.Context) openruntimes.Response {
	ctx.Log("ad-provider-health: not implemented; failing closed", "path="+ctx.Req.Path, "method="+ctx.Req.Method)

	return ctx.Res.Json(map[string]any{
		"status":    "FAILED",
		"result":    nil,
		"errorCode": "ad-provider-health_NOT_IMPLEMENTED",
		"retryable": false,
	})
}
