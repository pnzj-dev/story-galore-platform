import {
  Client,
  Account,
  Avatars,
  Databases,
  DocumentsDB,
  TablesDB,
  Storage,
  Teams,
  Messaging,
  Realtime,
} from "appwrite";

export { ID } from "appwrite";
export { OAuthProvider } from "appwrite";
export type { Models } from "appwrite";

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
}

/** @deprecated Use `AppwriteConfig`. */
export type AppwriteBrowserConfig = AppwriteConfig;

/**
 * Name of the http-only session cookie set by the server-side auth flow.
 * The value is an Appwrite session secret, validated server-side on every request.
 */
export const SESSION_COOKIE = "sg_session";

export function createBrowserClient(config: AppwriteConfig) {
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId);

  return {
    client,
    account: new Account(client),
    avatars: new Avatars(client),
    databases: new Databases(client),
    tablesDb: new TablesDB(client),
    documentsDb: new DocumentsDB(client),
    storage: new Storage(client),
    teams: new Teams(client),
    messaging: new Messaging(client),
    realtime: new Realtime(client),
  };
}

export interface ServerClientOptions {
  /** Appwrite session secret to authenticate with (read from the session cookie). */
  session?: string;
  /** Full `Cookie` header to forward; Appwrite parses its own session cookie. */
  cookie?: string;
}

/**
 * Server-side Appwrite client for SSR session validation and login.
 * Authenticates with the session secret only (no API key) and must never run in the browser.
 */
export function createServerClient(config: AppwriteConfig, options?: ServerClientOptions) {
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId);

  if (options?.session) client.setSession(options.session);
  if (options?.cookie) client.setCookie(options.cookie);

  return {
    client,
    account: new Account(client),
  };
}

/** Extract the `a_session_<project>` cookie value from a `Set-Cookie` header. */
function sessionValueFromSetCookie(setCookie: string | null, projectId: string): string {
  if (!setCookie) return "";
  const prefix = `a_session_${projectId}=`;
  const idx = setCookie.indexOf(prefix);
  if (idx === -1) return "";
  return setCookie.slice(idx + prefix.length).split(";")[0].trim();
}

/**
 * Create an email/password session and return its secret. Appwrite v28 delivers
 * the session secret via the `a_session_<project>` Set-Cookie (not the response
 * body), so this reads it from that header.
 */
export async function createEmailPasswordSessionSecret(
  config: AppwriteConfig,
  email: string,
  password: string,
): Promise<string> {
  const resp = await fetch(`${config.endpoint}/account/sessions/email`, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": config.projectId,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (resp.status >= 400) {
    const body = (await resp.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Invalid email or password.");
  }
  return sessionValueFromSetCookie(resp.headers.get("set-cookie"), config.projectId);
}

/** Create an OAuth provider session and return its session value. */
export async function createOAuthSessionSecret(
  config: AppwriteConfig,
  userId: string,
  secret: string,
): Promise<string> {
  const resp = await fetch(`${config.endpoint}/account/sessions`, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": config.projectId,
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId, secret }),
  });
  if (resp.status >= 400) {
    const body = (await resp.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Could not create session.");
  }
  return sessionValueFromSetCookie(resp.headers.get("set-cookie"), config.projectId);
}

/**
 * Server-side Appwrite client authenticated with a scoped API key.
 * Used for privileged operations (e.g. uploading to Storage) that run only in
 * server-side actions; never use in the browser.
 */
export function createAdminClient(config: AppwriteConfig, apiKey: string) {
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId).setKey(apiKey);

  return {
    client,
    account: new Account(client),
    avatars: new Avatars(client),
    databases: new Databases(client),
    tablesDb: new TablesDB(client),
    documentsDb: new DocumentsDB(client),
    storage: new Storage(client),
    teams: new Teams(client),
    messaging: new Messaging(client),
    realtime: new Realtime(client),
  };
}
