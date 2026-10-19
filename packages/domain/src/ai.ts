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
  creditCost?: number;
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

export interface PromptTemplate {
  id: string;
  projectId: string;
  name: string;
  template: string;
  variables?: string[];
  revision: number;
}

export interface CreditEligibilityInput {
  billingMode: AIBillingMode;
  executionLocation: AIExecutionLocation;
  ownerType: "STORYGALORE" | "WORKSPACE";
  /** Whether the model is registered as StoryGalore-managed and credit-eligible. */
  creditEligible: boolean;
}

/**
 * Deterministic credit-eligibility rule (contracts/deterministic/ai/credit-eligibility.yaml).
 * Creator Studio credits apply only to StoryGalore-managed, credit-eligible models.
 * BYOK and USER_HOSTED executions are always credit-ineligible.
 */
export function computeCreditEligibility(input: CreditEligibilityInput): AICreditEligibility {
  if (input.billingMode === "BYOK") {
    return { eligible: false, reason: "BYOK", fundingSource: "NONE" };
  }
  if (input.billingMode === "USER_HOSTED" || input.executionLocation === "USER_HOSTED") {
    return { eligible: false, reason: "USER_HOSTED", fundingSource: "NONE" };
  }
  if (
    input.billingMode === "PLATFORM_CREDITS" &&
    input.executionLocation === "CLOUD" &&
    input.ownerType === "STORYGALORE" &&
    input.creditEligible
  ) {
    return { eligible: true, reason: "STORYGALORE_MANAGED_MODEL", fundingSource: "STORYGALORE_MANAGED" };
  }
  return { eligible: false, reason: "PLATFORM_POLICY_DISABLED", fundingSource: "NONE" };
}

export type GenerationStatus =
  | "QUEUED"
  | "POLICY_CHECK"
  | "ALLOWED"
  | "RESERVED"
  | "PROCESSING"
  | "SETTLING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type GenerationEvent =
  | "POLICY_CHECK"
  | "ALLOW"
  | "DENY"
  | "RESERVE"
  | "PROCESS"
  | "SETTLE"
  | "COMPLETE"
  | "FAIL"
  | "CANCEL";

const GENERATION_TRANSITIONS: Record<GenerationStatus, Partial<Record<GenerationEvent, GenerationStatus>>> = {
  QUEUED: { POLICY_CHECK: "POLICY_CHECK", CANCEL: "CANCELLED" },
  POLICY_CHECK: { ALLOW: "ALLOWED", DENY: "FAILED", CANCEL: "CANCELLED" },
  ALLOWED: { RESERVE: "RESERVED" },
  RESERVED: { PROCESS: "PROCESSING", CANCEL: "CANCELLED" },
  PROCESSING: { SETTLE: "SETTLING", FAIL: "FAILED", CANCEL: "CANCELLED" },
  SETTLING: { COMPLETE: "COMPLETED", FAIL: "FAILED" },
  COMPLETED: {},
  FAILED: {},
  CANCELLED: {},
};

/**
 * Deterministic generation state machine (contracts/deterministic/ai/state-machine.yaml).
 * Returns the next status for a legal transition, or null for an illegal one.
 */
export function transitionGenerationStatus(from: GenerationStatus, event: GenerationEvent): GenerationStatus | null {
  return GENERATION_TRANSITIONS[from]?.[event] ?? null;
}

export type CreditTransactionKind = "RESERVE" | "SETTLE" | "REFUND";
export type CreditTransactionStatus = "RESERVED" | "SETTLED" | "REFUNDED";

export interface CreditTransaction {
  transactionId: string;
  generationId: string;
  creatorId: string;
  kind: CreditTransactionKind;
  amount: number;
  status: CreditTransactionStatus;
  createdAt: string;
}

/**
 * Resolve the StoryGalore-managed, credit-eligible provider for a PLATFORM_CREDITS
 * generation. Fails closed (null) when no ACTIVE, CLOUD, STORYGALORE-owned,
 * credit-eligible provider is registered.
 */
export function resolveCreditEligibleProvider(providers: AIProvider[]): AIProvider | null {
  return (
    providers.find(
      (p) =>
        p.status === "ACTIVE" &&
        p.executionLocation === "CLOUD" &&
        p.ownerType === "STORYGALORE" &&
        p.creditEligible,
    ) ?? null
  );
}
