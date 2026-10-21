#!/usr/bin/env python3
"""
Enforce the agent-capability reconciliation invariants.

Checks:
  1. Every capability referenced by tools/registry.yaml is in capability-registry.yaml.
  2. Every manifest `capabilities.allowed`/`forbidden` is in capability-registry.yaml.
  3. Every manifest `tools.allowed_tool_ids` exists in tools/registry.yaml and its
     capability is in the manifest's allowed set.
  4. Every `delegation.allowed_agents` target (except `*`) is a known agent slug.
  5. Every manifest `implementation.source_path` points at the generated runtime.
  6. Every capability in tools/gateway-operations.yaml is registered and its
     operation matches a real `api` gateway operation.

Exit 1 on any violation.
"""
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTRACTS = ROOT / "contracts" / "agents"
API_MAIN_GO = ROOT / "backend" / "appwrite" / "functions" / "api" / "main.go"

failures = []


def fail(msg):
    failures.append(msg)
    print(f"  FAIL: {msg}")


def load_manifests():
    out = {}
    for p in sorted((CONTRACTS / "manifests").glob("*.yaml")):
        out[p.stem] = yaml.safe_load(open(p))
    return out


def real_gateway_ops():
    text = API_MAIN_GO.read_text()
    return set(re.findall(r'case "([a-z0-9_]+)":', text))


def main():
    registry = yaml.safe_load(open(CONTRACTS / "capability-registry.yaml"))
    registered = {c["id"] for c in registry["capabilities"]}
    tools = yaml.safe_load(open(CONTRACTS / "tools" / "registry.yaml"))["tools"]
    manifests = load_manifests()

    tool_by_id = {t["id"]: t for t in tools}

    # 1. tool capabilities registered
    for t in tools:
        cap = t.get("capability")
        if cap and cap not in registered:
            fail(f"tool {t['id']} capability '{cap}' not in capability-registry.yaml")

    for slug, d in manifests.items():
        # 2. manifest allowed/forbidden registered
        for kind in ("allowed", "forbidden"):
            for cap in d["capabilities"][kind]:
                if cap not in registered:
                    fail(f"{slug}: capability.{kind} '{cap}' not in capability-registry.yaml")

        # 3. allowed_tool_ids exist + capability in allowed set
        allowed = set(d["capabilities"]["allowed"])
        for tool_id in d["tools"]["allowed_tool_ids"]:
            t = tool_by_id.get(tool_id)
            if t is None:
                fail(f"{slug}: allowed_tool_ids '{tool_id}' missing from tools/registry.yaml")
                continue
            cap = t.get("capability", "")
            if cap not in allowed:
                fail(f"{slug}: tool {tool_id} capability '{cap}' not in capabilities.allowed")

        # 4. delegation targets are valid slugs (or wildcard)
        for target in d["delegation"]["allowed_agents"]:
            if target != "*" and target not in manifests:
                fail(f"{slug}: delegation target '{target}' is not a known agent slug")

        # 5. source_path points at the generated runtime
        sp = d["implementation"]["source_path"]
        if not sp.startswith("backend/cloudflare/agents/src/agents/"):
            fail(f"{slug}: source_path '{sp}' should be under backend/cloudflare/agents/src/agents/")

    # 6. gateway operations reference registered capabilities + real gateway ops
    gw_ops = yaml.safe_load(open(CONTRACTS / "tools" / "gateway-operations.yaml")).get("operations", {})
    real_ops = real_gateway_ops()
    for cap, op in gw_ops.items():
        if cap not in registered:
            fail(f"gateway-operations: capability '{cap}' not in capability-registry.yaml")
        if op not in real_ops:
            fail(f"gateway-operations: '{op}' (for {cap}) is not a real api gateway operation")

    # 7. manifest execution.mode agrees with registry.yaml mode
    agent_registry = yaml.safe_load(open(CONTRACTS / "registry.yaml"))["agents"]
    registry_modes = {a["slug"]: a["mode"] for a in agent_registry}
    for slug, d in manifests.items():
        if slug in registry_modes and d["execution"]["mode"] != registry_modes[slug]:
            fail(f"{slug}: execution.mode '{d['execution']['mode']}' != registry.yaml mode '{registry_modes[slug]}'")

    if failures:
        print(f"\nagent-capability reconciliation FAILED: {len(failures)} violation(s)")
        sys.exit(1)
    print(f"agent-capability reconciliation PASS: {len(registered)} capabilities, "
          f"{len(tools)} tools, {len(manifests)} manifests, "
          f"{len(gw_ops)} gateway operations")


if __name__ == "__main__":
    main()
