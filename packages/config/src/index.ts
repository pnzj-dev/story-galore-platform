export * from "./dynamic";

export interface PublicRuntimeConfig {
  appwriteEndpoint: string;
  appwriteProjectId: string;
  publicSiteUrl: string;
}

export interface AdminRuntimeConfig {
  appwriteEndpoint: string;
  appwriteProjectId: string;
  adminSiteUrl: string;
}

// Environment variables are infrastructure/runtime bootstrap configuration only.
// Product policy and feature configuration must use DynamicConfigStore.
