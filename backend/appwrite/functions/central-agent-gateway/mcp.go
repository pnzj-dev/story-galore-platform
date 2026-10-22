package handler

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
)

// mcpServerArgs are the service enablement flags for the self-hosted
// mcp-server-appwrite. Keep them to the minimum the allowlist requires.
var mcpServerArgs = []string{"--tablesdb", "--users", "--storage", "--functions", "--messaging"}

// mcpServerEnv returns the environment for the self-hosted MCP server, sourced
// from the gateway's own ephemeral key + endpoint (never the agent's).
func mcpServerEnv() []string {
	project := os.Getenv("APPWRITE_FUNCTION_PROJECT_ID")
	if project == "" {
		project = os.Getenv("APPWRITE_PROJECT_ID")
	}
	key := os.Getenv("APPWRITE_FUNCTION_API_KEY")
	if key == "" {
		key = os.Getenv("APPWRITE_API_KEY")
	}
	endpoint := os.Getenv("APPWRITE_ENDPOINT")
	if endpoint == "" {
		endpoint = os.Getenv("APPWRITE_FUNCTION_API_ENDPOINT")
	}
	return append(os.Environ(),
		"APPWRITE_PROJECT_ID="+project,
		"APPWRITE_API_KEY="+key,
		"APPWRITE_ENDPOINT="+endpoint,
	)
}

// mcpMessage is a generic JSON-RPC 2.0 message.
type mcpMessage struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id,omitempty"`
	Method  string          `json:"method,omitempty"`
	Params  json.RawMessage `json:"params,omitempty"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// mcpClient holds a running mcp-server-appwrite process.
type mcpClient struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	reader *bufio.Reader
}

func newMcpClient() (*mcpClient, error) {
	cmd := exec.Command("uvx", append([]string{"mcp-server-appwrite"}, mcpServerArgs...)...)
	cmd.Env = mcpServerEnv()
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	c := &mcpClient{cmd: cmd, stdin: stdin, reader: bufio.NewReader(stdout)}
	if err := c.initialize(); err != nil {
		_ = cmd.Process.Kill()
		return nil, err
	}
	return c, nil
}

func (c *mcpClient) send(msg mcpMessage) error {
	b, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintf(c.stdin, "%s\n", b)
	return err
}

func (c *mcpClient) recv() (mcpMessage, error) {
	line, err := c.reader.ReadBytes('\n')
	if err != nil {
		return mcpMessage{}, err
	}
	var m mcpMessage
	if err := json.Unmarshal(line, &m); err != nil {
		return mcpMessage{}, err
	}
	return m, nil
}

func (c *mcpClient) initialize() error {
	params, _ := json.Marshal(map[string]interface{}{
		"protocolVersion": "2024-11-05",
		"capabilities":    map[string]interface{}{},
		"clientInfo":      map[string]interface{}{"name": "storygalore-gateway", "version": "1.0.0"},
	})
	if err := c.send(mcpMessage{JSONRPC: "2.0", ID: 1, Method: "initialize", Params: params}); err != nil {
		return err
	}
	if _, err := c.recv(); err != nil {
		return err
	}
	return c.send(mcpMessage{JSONRPC: "2.0", Method: "notifications/initialized"})
}

// call invokes a native MCP tool and returns its structured result.
func (c *mcpClient) call(toolName string, args map[string]interface{}) (json.RawMessage, error) {
	params, _ := json.Marshal(map[string]interface{}{"name": toolName, "arguments": args})
	if err := c.send(mcpMessage{JSONRPC: "2.0", ID: 2, Method: "tools/call", Params: params}); err != nil {
		return nil, err
	}
	resp, err := c.recv()
	if err != nil {
		return nil, err
	}
	if resp.Error != nil {
		return nil, fmt.Errorf("mcp tool error %d: %s", resp.Error.Code, resp.Error.Message)
	}
	return resp.Result, nil
}

func (c *mcpClient) close() {
	_ = c.stdin.Close()
	if c.cmd.Process != nil {
		_ = c.cmd.Process.Kill()
	}
}
