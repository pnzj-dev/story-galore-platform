"""MCP client: spawns the self-hosted mcp-server-appwrite and calls a tool."""

import os

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

MCP_ARGS = ["--tablesdb", "--users", "--storage", "--functions", "--messaging"]


def _mcp_env():
    """Env for the MCP server, sourced from the gateway's own ephemeral key."""
    project = os.environ.get("APPWRITE_FUNCTION_PROJECT_ID") or os.environ.get("APPWRITE_PROJECT_ID", "")
    key = os.environ.get("APPWRITE_FUNCTION_API_KEY") or os.environ.get("APPWRITE_API_KEY", "")
    endpoint = os.environ.get("APPWRITE_ENDPOINT") or os.environ.get("APPWRITE_FUNCTION_API_ENDPOINT", "")
    return {
        "APPWRITE_PROJECT_ID": project,
        "APPWRITE_API_KEY": key,
        "APPWRITE_ENDPOINT": endpoint,
    }


async def call_tool(native_tool, args):
    """Invoke a native MCP tool and return its text content (list of str)."""
    params = StdioServerParameters(command="mcp-server-appwrite", args=MCP_ARGS, env=_mcp_env())
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(native_tool, args)
            if result.isError:
                raise RuntimeError("mcp tool error")
            return [c.text for c in result.content if getattr(c, "text", None)]
