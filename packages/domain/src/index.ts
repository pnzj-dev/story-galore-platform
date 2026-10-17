export type ContentRating = "ALL_AGES" | "TEEN" | "ADULT_18_PLUS";
export type ContentOrigin = "HUMAN" | "AI_ASSISTED" | "AI_GENERATED" | "HYBRID";
export type PublicationStatus =
  | "DRAFT"
  | "PROCESSING"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "HIDDEN"
  | "REJECTED"
  | "REMOVED";


export type MediaAssetType =
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT";

export type MediaOrientation = "PORTRAIT" | "LANDSCAPE" | "SQUARE" | "UNKNOWN";
export type VideoDurationClass = "SHORT" | "MEDIUM" | "LONG";

export type PublicationType =
  | "BOOK"
  | "POST"
  | "VIDEO"
  | "AUDIO"
  | "MIXED";

export interface MediaAsset {
  id: string;
  type: MediaAssetType;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  orientation?: MediaOrientation;
  aspectRatio?: number;
  storageFileId: string;
  thumbnailFileId?: string;
  previewFileId?: string;
  processingStatus: "QUEUED" | "PROCESSING" | "READY" | "FAILED";
}

export interface MediaPublication {
  id: string;
  type: PublicationType;
  projectId?: string;
  seriesId?: string;
  volumeId?: string;
  mediaAssetIds: string[];
  title: string;
  contentRating: ContentRating;
  contentOrigin: ContentOrigin;
  publicationStatus: PublicationStatus;
}

export type ReadingFormat =
  | "PAGINATED"
  | "VERTICAL"
  | "HORIZONTAL"
  | "WEBTOON"
  | "STRIP"
  | "MIXED";

export interface ComicClassification {
  format: string;
  genres: string[];
  audience: string;
  publicationKind: "STANDALONE" | "SERIES" | "ONGOING" | "COMPLETED" | "ANTHOLOGY";
  readingFormat: ReadingFormat;
  originStyle: string;
  contentRating: ContentRating;
  contentOrigin: ContentOrigin;
  tags: string[];
}

export interface EntitlementSnapshot {
  userId: string;
  authenticated: boolean;
  ageEligible: boolean;
  paid: boolean;
  entitlements: string[];
  evaluatedAt: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason:
    | "ALLOWED"
    | "AUTH_REQUIRED"
    | "AGE_REQUIRED"
    | "PAYMENT_REQUIRED"
    | "ENTITLEMENT_REQUIRED"
    | "CONTENT_RESTRICTED"
    | "NOT_FOUND"
    | "POLICY_RESTRICTED";
}

export interface PaymentCapability {
  provider: string;
  oneTime: boolean;
  subscriptions: boolean;
  refunds: boolean;
  crypto: boolean;
  fiat: boolean;
}

export interface PaymentEventEnvelope {
  provider: string;
  providerEventId: string;
  eventType: string;
  receivedAt: string;
  signatureVerified: boolean;
  payloadRef?: string;
}

export function canAccessAdultContent(snapshot: EntitlementSnapshot): AccessDecision {
  if (!snapshot.authenticated) return { allowed: false, reason: "AUTH_REQUIRED" };
  if (!snapshot.ageEligible) return { allowed: false, reason: "AGE_REQUIRED" };
  if (!snapshot.paid) return { allowed: false, reason: "PAYMENT_REQUIRED" };
  return { allowed: true, reason: "ALLOWED" };
}

export * from "./ai";

export type CommentModerationState = "VISIBLE" | "PENDING_REVIEW" | "HIDDEN" | "REMOVED";
export type MessageState = "PENDING" | "SENT" | "FAILED" | "HIDDEN" | "REMOVED";
export type MessagingRecipientPolicy =
  | "EVERYONE"
  | "FOLLOWERS"
  | "SUBSCRIBERS"
  | "FOLLOWING"
  | "REQUESTS_ONLY"
  | "NOBODY";

export interface CommentRecord {
  id: string;
  publicationId: string;
  authorId: string;
  parentCommentId?: string;
  body: string;
  moderationState: CommentModerationState;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationRecord {
  id: string;
  type: "DIRECT";
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  state: MessageState;
  replyToMessageId?: string;
  createdAt: string;
}
