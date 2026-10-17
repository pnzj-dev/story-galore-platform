/// <reference types="astro/client" />
import type { Models } from "@storygalore/appwrite-client";

declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_APPWRITE_ENDPOINT: string;
    readonly PUBLIC_APPWRITE_PROJECT_ID: string;
    /** Server-side only (never exposed to the browser). */
    readonly APPWRITE_API_KEY: string;
  }

  namespace App {
    interface Locals {
      /** Verified Appwrite user from the server-side session, or null when anonymous. */
      user: Models.User | null;
    }
  }
}

export {};
