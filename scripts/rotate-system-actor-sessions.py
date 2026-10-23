#!/usr/bin/env python3
"""
Rotate the system-actor Appwrite sessions (admin + platform agents) and update
the Cloudflare secrets that carry them.

System actors authenticate to the `api` gateway via 1-year Appwrite sessions
(see docs/SECURITY.md, SEC-03 actor derivation). This script:

  1. Lists the current sessions for each system actor.
  2. Creates a fresh session for each.
  3. Updates the Cloudflare secrets:
       - ADMIN_SESSION_SECRET  (generation + prompt-redaction workflows)
       - AGENT_SESSION_SECRETS_A / _B  (agents worker; split to respect the
         Cloudflare 5.1 kB text-binding limit)
  4. Revokes the old sessions unless --no-delete.

Session creation happens before secret updates; old sessions are only revoked
after all secret updates succeed, so a mid-run failure leaves the old
credentials working (fail-safe).

Usage:
  python3 scripts/rotate-system-actor-sessions.py [--dry-run] [--no-delete]

Env (see .env): APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY,
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID.
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_DIR = ROOT / "contracts" / "agents" / "manifests"

ADMIN_USER_ID = "admin-service-account"

AGENTS_WORKER_DIR = ROOT / "backend" / "cloudflare" / "agents"
GENERATION_WORKER_DIR = ROOT / "backend" / "cloudflare" / "workflows" / "generation"
PROMPT_REDACTION_WORKER_DIR = ROOT / "backend" / "cloudflare" / "workflows" / "prompt-redaction"

# Local wrangler binary (installed in the agents workspace).
WRANGLER = AGENTS_WORKER_DIR / "node_modules" / ".bin" / "wrangler"

# Cloudflare text-binding secret limit (bytes). 17 x ~400-char secrets exceed it,
# so the agent map is split across two secrets.
SECRET_LIMIT_BYTES = 5_100


def fail(msg: str) -> "NoReturn":
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def require_env(*names: str) -> None:
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        fail(f"missing required env var(s): {', '.join(missing)}")


def agent_slugs() -> list[str]:
    slugs = []
    for path in sorted(MANIFEST_DIR.glob("*.yaml")):
        slugs.append(yaml.safe_load(path.read_text())["slug"])
    return slugs


def system_actors() -> list[str]:
    return [ADMIN_USER_ID] + [f"agent-{slug}" for slug in agent_slugs()]


def appwrite(method: str, path: str, body: dict | None = None) -> dict:
    endpoint = os.environ["APPWRITE_ENDPOINT"].rstrip("/")
    req = urllib.request.Request(
        endpoint + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "X-Appwrite-Key": os.environ["APPWRITE_API_KEY"],
            "X-Appwrite-Project": os.environ["APPWRITE_PROJECT_ID"],
            "Content-Type": "application/json",
        },
        method=method,
    )
    with urllib.request.urlopen(req) as r:
        raw = r.read()
    return json.loads(raw) if raw else {}


def list_sessions(user_id: str) -> list[dict]:
    return appwrite("GET", f"/users/{user_id}/sessions").get("sessions", [])


def create_session(user_id: str) -> dict:
    return appwrite("POST", f"/users/{user_id}/sessions", {})


def delete_session(user_id: str, session_id: str) -> None:
    appwrite("DELETE", f"/users/{user_id}/sessions/{session_id}")


def put_secret(worker_dir: Path, name: str, value: str) -> None:
    subprocess.run(
        [str(WRANGLER), "secret", "put", name],
        input=value,
        text=True,
        cwd=str(worker_dir),
        env={
            **os.environ,
            "CLOUDFLARE_API_TOKEN": os.environ.get("CLOUDFLARE_API_TOKEN", ""),
        },
        check=True,
        capture_output=True,
    )


def split_map(m: dict[str, str]) -> tuple[dict, dict]:
    """Split a slug->secret map into two parts under the Cloudflare secret limit."""
    a: dict[str, str] = {}
    b: dict[str, str] = {}
    for k, v in m.items():
        target = a if len(json.dumps({**a, k: v})) <= SECRET_LIMIT_BYTES else b
        target[k] = v
    return a, b


def main() -> None:
    parser = argparse.ArgumentParser(description="Rotate system-actor Appwrite sessions + Cloudflare secrets.")
    parser.add_argument("--dry-run", action="store_true", help="list existing sessions only, make no changes")
    parser.add_argument("--no-delete", action="store_true", help="keep the old sessions after rotating")
    args = parser.parse_args()

    require_env("APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY")
    if not args.dry_run:
        require_env("CLOUDFLARE_API_TOKEN")

    actors = system_actors()
    old_sessions: dict[str, list[str]] = {}
    new_secrets: dict[str, str] = {}

    for uid in actors:
        olds = list_sessions(uid)
        old_sessions[uid] = [s["$id"] for s in olds]
        if args.dry_run:
            print(f"[dry-run] {uid}: {len(olds)} existing session(s)")
            continue
        sess = create_session(uid)
        new_secrets[uid] = sess["secret"]
        print(f"created session for {uid} (expires {sess.get('expire')})")

    if args.dry_run:
        print("dry-run complete; no changes made.")
        return

    admin_secret = new_secrets[ADMIN_USER_ID]
    agent_map = {
        uid[len("agent-"):]: secret
        for uid, secret in new_secrets.items()
        if uid.startswith("agent-")
    }
    part_a, part_b = split_map(agent_map)

    # Update secrets before revoking anything (fail-safe ordering).
    put_secret(GENERATION_WORKER_DIR, "ADMIN_SESSION_SECRET", admin_secret)
    put_secret(PROMPT_REDACTION_WORKER_DIR, "ADMIN_SESSION_SECRET", admin_secret)
    put_secret(AGENTS_WORKER_DIR, "AGENT_SESSION_SECRETS_A", json.dumps(part_a))
    put_secret(AGENTS_WORKER_DIR, "AGENT_SESSION_SECRETS_B", json.dumps(part_b))
    print(f"updated Cloudflare secrets (agents split {len(part_a)}/{len(part_b)}).")

    if args.no_delete:
        print("kept old sessions (--no-delete); revoke manually after verifying.")
        return

    for uid, ids in old_sessions.items():
        for sid in ids:
            delete_session(uid, sid)
    print("revoked old sessions.")


if __name__ == "__main__":
    main()
