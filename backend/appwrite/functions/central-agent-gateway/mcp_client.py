"""MCP client: spawns the self-hosted mcp-server-appwrite and calls a tool."""

import os

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

MCP_ARGS = []  # the server enables all services by default (no service flags)


def _mcp_env(api_key):
    """Env for the MCP server: runtime project id + endpoint + ephemeral key."""
    project = os.environ.get("APPWRITE_FUNCTION_PROJECT_ID") or os.environ.get("APPWRITE_PROJECT_ID", "")
    endpoint = os.environ.get("APPWRITE_ENDPOINT") or os.environ.get("APPWRITE_FUNCTION_API_ENDPOINT", "")
    return {
        "APPWRITE_PROJECT_ID": project,
        "APPWRITE_API_KEY": api_key,
        "APPWRITE_ENDPOINT": endpoint,
    }


async def call_tool(native_tool, args, api_key, project_id):
    """Invoke a native Appwrite tool through appwrite_call_tool (the operator
    pattern), returning its text content."""
    # Run the module directly (the console-script entry point is not on the
    # runtime PATH in serverless environments).
    params = StdioServerParameters(command="python", args=["-m", "mcp_server_appwrite", *MCP_ARGS], env=_mcp_env(api_key))
    try:
        async with stdio_client(params, errlog=None) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool("appwrite_call_tool", {
                    "tool_name": native_tool,
                    "arguments": args,
                    "project_id": project_id,
                })
                if result.is_error:
                    raise RuntimeError("mcp tool error: %s" % result.content)
                return [c.text for c in result.content if getattr(c, "text", None)]
    except BaseException as exc:
        def flatten(e):
            if isinstance(e, BaseExceptionGroup):
                for sub in e.exceptions:
                    yield from flatten(sub)
            else:
                yield e
        msgs = ["%s: %s" % (type(s).__name__, s) for s in flatten(exc)]
        print("MCP_CALL_ERROR: " + " | ".join(msgs), flush=True)
        raise
