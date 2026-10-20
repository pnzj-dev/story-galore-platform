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
