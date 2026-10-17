export type AIExecutionLocation = "CLOUD" | "USER_HOSTED";
export type AIProviderOwnership = "STORYGALORE" | "USER";
export type AIBillingMode = "PLATFORM_CREDITS" | "BYOK" | "USER_HOSTED";
export type AICreditFundingSource = "STORYGALORE_MANAGED" | "NONE";
export type AIProtocol = "OPENAI_COMPATIBLE" | "OLLAMA" | "COMFYUI" | "PROVIDER_NATIVE" | "OTHER";
export type AICapability = "TEXT_GENERATION" | "VISION" | "EMBEDDINGS" | "IMAGE_GENERATION" | "IMAGE_EDITING" | "VIDEO_GENERATION" | "AUDIO_GENERATION" | "SPEECH_TO_TEXT" | "TEXT_TO_SPEECH" | "STREAMING" | "STRUCTURED_OUTPUT";
export type AIAdultPolicy = "ADULT_ALLOWED" | "ADULT_NOT_ALLOWED" | "ADULT_REQUIRES_VERIFICATION";
export type AICatalogVisibility = "VISIBLE" | "HIDDEN" | "RESTRICTED";

export interface AIPolicyRecord {
  providerId: string;
  modelId: string;
  executionLocation: AIExecutionLocation;
  protocol: AIProtocol;
  capabilities: AICapability[];
  adultPolicy: AIAdultPolicy;
  allowedAdultCategories?: string[];
  prohibitedAdultCategories?: string[];
  regions?: string[];
  sourceUrls?: string[];
  reviewedAt?: string;
  reviewAfter?: string;
  reviewedBy?: string;
  policyVersion?: string;
}

export interface AICreditEligibility {
  eligible: boolean;
  reason: "STORYGALORE_MANAGED_MODEL" | "BYOK" | "USER_HOSTED" | "PLATFORM_POLICY_DISABLED";
  fundingSource: AICreditFundingSource;
}

export interface AIProvider {
  id: string;
  providerId: string;
  displayName: string;
  executionLocation: AIExecutionLocation;
  protocol: AIProtocol;
  ownerType: "STORYGALORE" | "WORKSPACE";
  ownership: AIProviderOwnership;
  creditEligible: boolean;
  ownerId?: string;
  status: "ACTIVE" | "DISABLED" | "UNREACHABLE" | "REQUIRES_REAUTH" | "POLICY_RESTRICTED";
  credentialRef?: string;
  endpointRef?: string;
  createdAt: string;
  lastTestedAt?: string;
  lastUsedAt?: string;
}

export interface AIModelDescriptor {
  providerId: string;
  modelId: string;
  displayName?: string;
  capabilities: AICapability[];
  contextWindow?: number;
  limits?: Record<string, number | string | boolean>;
  usageMetadata?: Record<string, number | string>;
  adultPolicy?: AIAdultPolicy;
  policyRecordRef?: string;
}

export interface AIGenerationExecution {
  billingMode: AIBillingMode;
  creditEligibility: AICreditEligibility;
  executionLocation: AIExecutionLocation;
  providerId: string;
  modelId: string;
  protocol: AIProtocol;
  capabilities: AICapability[];
  providerRequestId?: string;
  estimatedProviderCost?: number;
  actualProviderCost?: number;
  storygaloreCost?: number;
  creditCost?: number;
  policyDecision?: "ALLOW" | "DENY";
  policyReason?: string;
}

export interface AICredentialMetadata {
  providerId: string;
  ownerId: string;
  status: "VALID" | "INVALID" | "REQUIRES_REAUTH" | "DISABLED";
  maskedIdentifier?: string;
  fingerprint?: string;
  secretRef: string;
  createdAt: string;
  rotatedAt?: string;
  lastTestedAt?: string;
  lastUsedAt?: string;
}

export interface AIPlatformSettings {
  adultCatalogEnabled: boolean;
  adultGenerationEnabled: boolean;
  adultDiscoveryEnabled: boolean;
  adultRecommendationsEnabled: boolean;
  adultSearchEnabled: boolean;
  aiGenerationEnabled: boolean;
  byokEnabled: boolean;
  userHostedAIEnabled: boolean;
  imageGenerationEnabled: boolean;
  videoGenerationEnabled: boolean;
  emergencyDisabledProviders: string[];
}
