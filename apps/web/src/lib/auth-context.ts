import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request auth context. The middleware stores the Appwrite session secret
 * here so the `invokeApi` gateway call can forward it to the `api` function,
 * which derives the actor server-side (SEC-03) instead of trusting the body
 * actorId claim.
 */
export interface AuthContext {
  session?: string;
}

export const authContext = new AsyncLocalStorage<AuthContext>();
