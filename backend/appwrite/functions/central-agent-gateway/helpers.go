package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"os"
	"time"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/client"
	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

// newAuditClient builds the Appwrite client used only for the gateway audit
// event, using the gateway's own ephemeral key (never the agent's credentials).
func newAuditClient(ctx openruntimes.Context) client.Client {
	endpoint := os.Getenv("APPWRITE_ENDPOINT")
	if endpoint == "" {
		endpoint = os.Getenv("APPWRITE_FUNCTION_API_ENDPOINT")
	}
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

func newUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	dst := make([]byte, 36)
	hex.Encode(dst[0:8], b[0:4])
	dst[8] = '-'
	hex.Encode(dst[9:13], b[4:6])
	dst[13] = '-'
	hex.Encode(dst[14:18], b[6:8])
	dst[18] = '-'
	hex.Encode(dst[19:23], b[8:10])
	dst[23] = '-'
	hex.Encode(dst[24:36], b[10:16])
	return string(dst)
}

func mustJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func now() string {
	return time.Now().Format(time.RFC3339Nano)
}
