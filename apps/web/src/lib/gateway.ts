import type { MediaType, ContentRating, MediaCardData, CreatorCardData } from "@storygalore/ui";
import type { MessageKey } from "@/i18n";
import { authContext } from "@/lib/auth-context";

export interface GatewayOutput<T = unknown> {
  status: "SUCCESS" | "FAILED";
  operationId: string | null;
  result: T;
  errorCode: string | null;
  retryable: boolean;
}

interface ContinueProgress {
  publicationId: string;
  episodeId?: string;
  pageId?: string;
  position?: number;
  percentComplete?: number;
  status?: string;
}

interface ContinuePublication {
  title?: string;
  type?: string;
  format?: string;
  contentRating?: string;
  creatorId?: string;
}

interface ContinueItem {
  progress: ContinueProgress;
  publication?: ContinuePublication;
  coverUrl?: string;
  backdropUrl?: string;
  creatorName?: string;
}

const VALID_TYPES: MediaType[] = ["BOOK", "POST", "VIDEO", "AUDIO", "MIXED"];

/** Format seconds as M:SS (or H:MM:SS) for resume labels. */
function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const rem = s % 60;
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

/**
 * Invoke the `api` gateway function synchronously (server-side only).
 * Uses the narrowly-scoped server API key; never call from the browser.
 * When a user session is present in the request context it is forwarded so the
 * gateway derives the actor server-side (SEC-03) instead of the body claim.
 */
export async function invokeApi<T>(
  operation: string,
  input: unknown,
  actorId: string,
): Promise<GatewayOutput<T>> {
  const endpoint = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
  const projectId = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = import.meta.env.APPWRITE_API_KEY;

  const gatewayInput = {
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    actorId,
    session: authContext.getStore()?.session,
    payload: { operation, input },
  };

  const res = await fetch(`${endpoint}/functions/api/executions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
    body: JSON.stringify({ body: JSON.stringify(gatewayInput), async: false }),
  });

  if (!res.ok) {
    return {
      status: "FAILED",
      operationId: null,
      result: null as T,
      errorCode: `GATEWAY_HTTP_${res.status}`,
      retryable: res.status >= 500,
    };
  }

  const execution = (await res.json()) as { responseBody?: string };
  try {
    return JSON.parse(execution.responseBody ?? "{}") as GatewayOutput<T>;
  } catch {
    return {
      status: "FAILED",
      operationId: null,
      result: null as T,
      errorCode: "GATEWAY_INVALID_RESPONSE",
      retryable: false,
    };
  }
}

export interface LanguagePreferences {
  uiLocale?: string;
  contentLanguages: string[];
  contentLanguageMode: "ALL" | "ONLY_SELECTED";
  direction?: string;
}

/** Fetch the authenticated user's content-language preferences (ALL by default). */
export async function fetchLanguagePreferences(actorId: string): Promise<LanguagePreferences> {
  const out = await invokeApi<LanguagePreferences>("language_preferences_get", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result) {
    return { contentLanguages: [], contentLanguageMode: "ALL" };
  }
  return out.result;
}

export interface CommentItem {
  $id: string;
  targetType?: string;
  targetId?: string;
  userId?: string;
  parentCommentId?: string;
  body?: string;
  status?: string;
  authorName?: string;
  createdAt?: string;
}

/** Fetch PUBLISHED comments (plus the actor's own) for a target. */
export async function fetchComments(
  actorId: string,
  targetType: string,
  targetId: string,
): Promise<CommentItem[]> {
  const out = await invokeApi<{ items?: CommentItem[] }>("comment_list", { targetType, targetId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch all comments with author names (admin moderation queue). */
export async function fetchAdminComments(actorId: string): Promise<CommentItem[]> {
  const out = await invokeApi<{ items?: CommentItem[] }>("admin_comment_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Search PUBLISHED publications by title/description (server-authoritative). */
export async function searchPublications(query: string, type?: string): Promise<MediaCardData[]> {
  const out = await invokeApi<{ items?: PublicationItem[] }>("search", { query, type }, "");
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items
    .filter((item) => Boolean(item.publication?.$id))
    .map((item) => {
      const pub = item.publication!;
      const t = VALID_TYPES.includes(pub.type as MediaType) ? (pub.type as MediaType) : "BOOK";
      return {
        id: pub.$id!,
        title: pub.title ?? "Untitled",
        type: t,
        format: pub.format,
        contentRating: pub.contentRating as ContentRating | undefined,
        coverUrl: item.coverUrl,
        backdropUrl: item.backdropUrl,
        creatorName: item.creatorName,
      } satisfies MediaCardData;
    });
}

export interface DownloadPolicy {
  downloadPolicy?: string;
  canDownload?: boolean;
  reason?: string;
  formats?: string[];
}

/** Resolve a publication's download policy for the actor (server-authoritative). */
export async function fetchDownloadPolicy(actorId: string, publicationId: string): Promise<DownloadPolicy> {
  const out = await invokeApi<DownloadPolicy>("publication_download_policy_get", { publicationId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return { canDownload: false };
  return out.result;
}

/** Fetch related/recommended publications (same type), ordered by recency. */
export async function fetchRecommendations(publicationId?: string): Promise<MediaCardData[]> {
  const out = await invokeApi<{ items?: PublicationItem[] }>(
    "recommendations_get",
    publicationId ? { publicationId } : {},
    "",
  );
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items
    .filter((item) => Boolean(item.publication?.$id))
    .map((item) => {
      const pub = item.publication!;
      const t = VALID_TYPES.includes(pub.type as MediaType) ? (pub.type as MediaType) : "BOOK";
      return {
        id: pub.$id!,
        title: pub.title ?? "Untitled",
        type: t,
        format: pub.format,
        contentRating: pub.contentRating as ContentRating | undefined,
        coverUrl: item.coverUrl,
        backdropUrl: item.backdropUrl,
        creatorName: item.creatorName,
      } satisfies MediaCardData;
    });
}

export interface FeatureFlag {
  key?: string;
  enabled?: boolean;
  description?: string;
  updatedAt?: string;
}

/** List feature flags (admin-only; safe projection for gate reads). */
export async function fetchFeatureFlags(actorId: string): Promise<FeatureFlag[]> {
  const out = await invokeApi<{ items?: FeatureFlag[] }>("feature_flag_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Return the set of enabled feature-flag keys (hot-reloadable config). */
export async function fetchEnabledFlagKeys(actorId = ""): Promise<Set<string>> {
  const flags = await fetchFeatureFlags(actorId);
  return new Set(flags.filter((f) => f.enabled).map((f) => f.key ?? "").filter(Boolean));
}

/** Fetch the authenticated user's in-progress items for the Continue rail. */
export async function fetchContinueItems(actorId: string): Promise<MediaCardData[]> {
  const out = await invokeApi<{ items?: ContinueItem[] }>("continue_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];

  return out.result.items
    .filter((item) => Boolean(item.progress?.publicationId))
    .map((item) => {
      const pub = item.publication ?? {};
      const progress = item.progress;
      const type = VALID_TYPES.includes(pub.type as MediaType)
        ? (pub.type as MediaType)
        : "BOOK";
      const isTimed = type === "VIDEO" || type === "AUDIO";
      return {
        id: progress.publicationId,
        title: pub.title ?? "Untitled",
        type,
        format: pub.format,
        contentRating: pub.contentRating as ContentRating | undefined,
        coverUrl: item.coverUrl,
        backdropUrl: item.backdropUrl ?? item.coverUrl,
        creatorName: item.creatorName,
        progress: {
          percentComplete: progress.percentComplete ?? 0,
          label:
            progress.position != null
              ? isTimed
                ? progress.position > 0
                  ? formatClock(progress.position)
                  : undefined
                : `Page ${progress.position + 1}`
              : undefined,
        },
      } satisfies MediaCardData;
    });
}

interface PublicationItem {
  publication?: {
    $id?: string;
    title?: string;
    type?: string;
    format?: string;
    contentRating?: string;
  };
  coverUrl?: string;
  backdropUrl?: string;
  creatorName?: string;
}

/** Fetch published publications for a discovery rail (trending or new). */
export async function fetchPublications(
  sort: "trending" | "new",
  creatorId?: string,
): Promise<MediaCardData[]> {
  const out = await invokeApi<{ items?: PublicationItem[] }>(
    "publication_list",
    { sort, creatorId },
    "",
  );
  if (out.status !== "SUCCESS" || !out.result?.items) return [];

  return out.result.items
    .filter((item) => Boolean(item.publication?.$id))
    .map((item) => {
      const pub = item.publication!;
      const type = VALID_TYPES.includes(pub.type as MediaType)
        ? (pub.type as MediaType)
        : "BOOK";
      return {
        id: pub.$id!,
        title: pub.title ?? "Untitled",
        type,
        format: pub.format,
        contentRating: pub.contentRating as ContentRating | undefined,
        coverUrl: item.coverUrl,
        backdropUrl: item.backdropUrl,
        creatorName: item.creatorName,
      } satisfies MediaCardData;
    });
}

/** A page of browse results. */
export interface MediaPage {
  items: MediaCardData[];
  hasMore: boolean;
}

/** Options for browsing media by type (pagination + optional format filtering). */
export interface MediaByTypeOptions {
  format?: string;
  excludeFormat?: string;
  sort?: "trending" | "new";
  limit?: number;
  offset?: number;
}

/** Fetch published publications filtered by media type and/or format (browse). */
export async function fetchMediaByType(
  type: string,
  opts: MediaByTypeOptions = {},
): Promise<MediaPage> {
  const out = await invokeApi<{ items?: PublicationItem[]; hasMore?: boolean }>(
    "publication_list",
    {
      sort: opts.sort ?? "trending",
      type,
      format: opts.format,
      excludeFormat: opts.excludeFormat,
      limit: opts.limit ?? 24,
      offset: opts.offset ?? 0,
    },
    "",
  );
  if (out.status !== "SUCCESS" || !out.result?.items) return { items: [], hasMore: false };
  const items = out.result.items
    .filter((item) => Boolean(item.publication?.$id))
    .map((item) => {
      const pub = item.publication!;
      const t = VALID_TYPES.includes(pub.type as MediaType) ? (pub.type as MediaType) : "BOOK";
      return {
        id: pub.$id!,
        title: pub.title ?? "Untitled",
        type: t,
        format: pub.format,
        contentRating: pub.contentRating as ContentRating | undefined,
        coverUrl: item.coverUrl,
        backdropUrl: item.backdropUrl,
        creatorName: item.creatorName,
      } satisfies MediaCardData;
    });
  return { items, hasMore: out.result.hasMore ?? false };
}

export interface CollectionSummary {
  $id?: string;
  title?: string;
  description?: string;
  curatorId?: string;
  status?: string;
  visibility?: string;
  publicationIds?: string[];
  coverPublicationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Fetch collections visible to the actor (own + public published). */
export async function fetchCollections(actorId: string): Promise<CollectionSummary[]> {
  const out = await invokeApi<{ items?: CollectionSummary[] }>("collection_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch a single collection (own, admin, or public+published). */
export async function fetchCollection(actorId: string, collectionId: string): Promise<CollectionSummary | null> {
  const out = await invokeApi<CollectionSummary>("collection_get", { collectionId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

/** Resolve a collection's publicationIds into MediaCardData for the detail page. */
export async function fetchCollectionItems(actorId: string, collection: CollectionSummary): Promise<MediaCardData[]> {
  const ids = collection.publicationIds ?? [];
  const items: MediaCardData[] = [];
  for (const id of ids) {
    const detail = await fetchPublication(id, actorId);
    if (!detail?.publication?.$id) continue;
    const pub = detail.publication;
    const t = VALID_TYPES.includes(pub.type as MediaType) ? (pub.type as MediaType) : "BOOK";
    items.push({
      id: pub.$id,
      title: pub.title ?? "Untitled",
      type: t,
      format: pub.format,
      contentRating: pub.contentRating as ContentRating | undefined,
      coverUrl: detail.coverUrl,
      creatorName: detail.creatorName,
    } satisfies MediaCardData);
  }
  return items;
}

/** Fetch the authenticated user's saved ("My List") publications. */
export async function fetchSavedTitles(actorId: string): Promise<MediaCardData[]> {
  const out = await invokeApi<{ items?: PublicationItem[] }>("library_entry_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items
    .filter((item) => Boolean(item.publication?.$id))
    .map((item) => {
      const pub = item.publication!;
      const t = VALID_TYPES.includes(pub.type as MediaType) ? (pub.type as MediaType) : "BOOK";
      return {
        id: pub.$id!,
        title: pub.title ?? "Untitled",
        type: t,
        format: pub.format,
        contentRating: pub.contentRating as ContentRating | undefined,
        coverUrl: item.coverUrl,
        backdropUrl: item.backdropUrl,
        creatorName: item.creatorName,
      } satisfies MediaCardData;
    });
}

/** Fetch the set of saved publication ids (for the Save button state). */
export async function fetchSavedPublicationIds(actorId: string): Promise<Set<string>> {
  const out = await invokeApi<{ items?: PublicationItem[] }>("library_entry_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return new Set();
  return new Set(
    out.result.items
      .map((item) => item.publication?.$id)
      .filter((id): id is string => Boolean(id)),
  );
}

export interface MediaDeliveryItem {
  mediaId: string;
  allowed: boolean;
  url?: string;
  position?: number;
  label?: string;
  durationMs?: number;
}

export interface PublicationDetail {
  publication: {
    $id: string;
    title?: string;
    description?: string;
    type?: string;
    format?: string;
    contentRating?: string;
    accessClass?: string;
    creatorId?: string;
    seriesId?: string;
    rating?: number;
    genres?: string[];
  };
  media: MediaDeliveryItem[];
  entitled: boolean;
  accessClass?: string;
  coverUrl?: string;
  backdropUrl?: string;
  creatorName?: string;
  year?: number;
  durationMs?: number;
}

export interface SeriesEpisode {
  publicationId?: string;
  title?: string;
  episodeId?: string;
  episodeNumber?: number;
  mediaId?: string;
  url?: string;
  durationMs?: number;
  coverUrl?: string;
  allowed?: boolean;
}

/** Fetch the ordered, authorized episodes of a series for sequential playback. */
export async function fetchSeriesEpisodes(seriesId: string, actorId = ""): Promise<SeriesEpisode[]> {
  const out = await invokeApi<{ items?: SeriesEpisode[] }>("series_episodes", { seriesId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch the authenticated user's saved media position for a publication. */
export async function fetchMediaProgress(
  actorId: string,
  publicationId: string,
): Promise<{ position: number; pageId?: string }> {
  const out = await invokeApi<{ position?: number; pageId?: string }>(
    "reading_progress_get",
    { publicationId },
    actorId,
  );
  if (out.status !== "SUCCESS" || !out.result) return { position: 0 };
  return { position: out.result.position ?? 0, pageId: out.result.pageId };
}

export interface NotificationItem {
  $id: string;
  userId?: string;
  type?: string;
  subject?: string;
  body?: string;
  status?: string;
  read?: boolean;
  createdAt?: string;
}

/** Fetch the authenticated user's notifications, newest first. */
export async function fetchNotifications(actorId: string): Promise<NotificationItem[]> {
  const out = await invokeApi<{ items?: NotificationItem[] }>("notification_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch a single published publication with its authorized media URLs. */
export async function fetchPublication(
  publicationId: string,
  actorId = "",
): Promise<PublicationDetail | null> {
  const out = await invokeApi<PublicationDetail>(
    "publication_get",
    { publicationId },
    actorId,
  );
  if (out.status !== "SUCCESS" || !out.result?.publication) return null;
  return out.result;
}

interface CreatorItem {
  actorId?: string;
  handle?: string;
  displayName?: string;
  avatarMediaAssetId?: string;
  followerCountProjection?: number;
}/** Fetch active creators for the Discover creators rail. */
export async function fetchCreators(): Promise<CreatorCardData[]> {
  const out = await invokeApi<{ items?: CreatorItem[] }>("creator_list", {}, "");
  if (out.status !== "SUCCESS" || !out.result?.items) return [];

  return out.result.items
    .filter((c) => Boolean(c.actorId))
    .map((c) => ({
      id: c.actorId!,
      displayName: c.displayName ?? c.handle ?? "Creator",
      handle: c.handle ?? "",
      followerCount: c.followerCountProjection,
    } satisfies CreatorCardData));
}

export interface CreatorProfile {
  $id?: string;
  actorId: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarMediaAssetId?: string;
  coverMediaAssetId?: string;
  followerCountProjection?: number;
  verificationStatus?: string;
  links?: string[];
}

/** Fetch a single creator profile by actorId (Appwrite user ID). */
export async function fetchCreator(actorId: string): Promise<CreatorProfile | null> {
  const out = await invokeApi<CreatorProfile>("creator_get", { actorId }, "");
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

export interface ProjectSummary {
  $id?: string;
  name?: string;
  status?: string;
  description?: string;
  updatedAt?: string;
}

/** Fetch a creator's projects (scoped server-side to the actor). */
export async function fetchProjects(actorId: string): Promise<ProjectSummary[]> {
  const out = await invokeApi<{ items?: ProjectSummary[] }>("project_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch a single project by ID (server-side ownership check). */
export async function fetchProject(actorId: string, projectId: string): Promise<ProjectSummary | null> {
  const out = await invokeApi<ProjectSummary>("project_get", { projectId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

export interface DocumentSummary {
  $id?: string;
  title?: string;
  type?: string;
  format?: string;
}

/** Fetch a project's documents (scoped server-side to the actor). */
export async function fetchDocuments(actorId: string, projectId: string): Promise<DocumentSummary[]> {
  const out = await invokeApi<{ items?: DocumentSummary[] }>("document_list", { projectId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface StudioPanelSummary {
  $id?: string;
  position?: number;
  bounds?: string;
  shape?: string;
}

export interface StudioPageSummary {
  $id?: string;
  position?: number;
  width?: number;
  height?: number;
  panels?: StudioPanelSummary[];
}

export interface StudioDocumentDetail {
  document: {
    $id?: string;
    title?: string;
    type?: string;
    format?: string;
    readingFormat?: string;
    pageWidth?: number;
    pageHeight?: number;
  };
  pages: StudioPageSummary[];
}

/** Fetch a document (with ordered pages + panels) for the editor. */
export async function fetchDocument(actorId: string, documentId: string): Promise<StudioDocumentDetail | null> {
  const out = await invokeApi<StudioDocumentDetail>("document_get", { documentId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.document) return null;
  return out.result;
}

export interface RevisionSummary {
  $id?: string;
  documentId?: string;
  revision?: number;
  immutable?: boolean;
  createdAt?: string;
}

/** List a document's revisions, newest first (scoped server-side to the actor). */
export async function fetchRevisions(actorId: string, documentId: string): Promise<RevisionSummary[]> {
  const out = await invokeApi<{ items?: RevisionSummary[] }>("document_revision_list", { documentId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface MediaAssetSummary {
  $id?: string;
  id?: string;
  type?: string;
  status?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt?: string;
}

/** Fetch the creator's ready IMAGE assets for the studio media library. */
export async function fetchMediaAssets(actorId: string): Promise<MediaAssetSummary[]> {
  const out = await invokeApi<{ items?: MediaAssetSummary[] }>("media_asset_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface AdCampaign {
  $id?: string;
  name?: string;
  status?: string;
  advertiser?: string;
  priority?: number;
  placementIds?: string[];
}

export interface AdPlacement {
  $id?: string;
  placementKey?: string;
  label?: string;
  status?: string;
}

export interface AdCreative {
  $id?: string;
  name?: string;
  assetType?: string;
  storageBucketKey?: string;
  storageFileId?: string;
  width?: number;
  height?: number;
  url?: string;
}

/** Fetch ad campaigns (admin surface). */
export async function fetchAdCampaigns(): Promise<AdCampaign[]> {
  const out = await invokeApi<{ items?: AdCampaign[] }>("ad_campaign_list", {}, "");
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch ad placements (admin surface). */
export async function fetchAdPlacements(): Promise<AdPlacement[]> {
  const out = await invokeApi<{ items?: AdPlacement[] }>("ad_placement_list", {}, "");
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Server-side ad selection for a placement (never decide eligibility client-side). */
export async function fetchAd(placementKey: string, actorId = ""): Promise<AdCreative | null> {
  const out = await invokeApi<{ eligible?: boolean; creative?: AdCreative | null }>(
    "ad_eligible_creative_get",
    { placementKey },
    actorId,
  );
  if (out.status !== "SUCCESS" || !out.result?.eligible || !out.result?.creative) return null;
  return out.result.creative;
}

export interface AdminOverview {
  kpis: {
    activePaidSubscribers: number;
    mrrCents: number;
    newSubscribers30d: number;
    churned30d: number;
    revenue30dCents: number;
    activeReaders30d: number;
    publishedContent: number;
    aiJobs30d: number;
  };
  charts: {
    revenueTrend: Array<{ date: string; value: number }>;
    newSubscriberTrend: Array<{ date: string; value: number }>;
    churnTrend: Array<{ date: string; value: number }>;
  };
}

/** Fetch the admin overview KPIs + chart series (admin-only, server-side). */
export async function fetchAdminOverview(actorId: string): Promise<AdminOverview | null> {
  const out = await invokeApi<AdminOverview>("admin_overview_get", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.kpis) return null;
  return out.result;
}

export interface AdminUser {
  $id?: string;
  name?: string;
  email?: string;
  labels?: string[];
  createdAt?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

/** List users (admin-only, safe projection). */
export async function fetchAdminUsers(actorId: string): Promise<AdminUser[]> {
  const out = await invokeApi<{ items?: AdminUser[] }>("admin_users_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch an admin-only list (server-side, admin-gated). */
export async function fetchAdminList(operation: string, actorId: string): Promise<Array<Record<string, unknown>>> {
  const out = await invokeApi<{ items?: Array<Record<string, unknown>> }>(operation, {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface AnalyticsBreakdown {
  contentByType?: Record<string, number>;
  contentByStatus?: Record<string, number>;
  subscriptionsByStatus?: Record<string, number>;
  paymentsByProvider?: Record<string, number>;
  paymentsByStatus?: Record<string, number>;
  creatorsByStatus?: Record<string, number>;
}

export interface RetentionSummary {
  totalActors?: number;
  returnedActors?: number;
  returnRate?: number;
}

export interface FunnelStep {
  step?: string;
  actors?: number;
}

export async function fetchAdminAnalytics(actorId: string): Promise<AnalyticsBreakdown | null> {
  const out = await invokeApi<AnalyticsBreakdown>("admin_analytics_get", {}, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result;
}

export interface AdminOperations {
  domainEvents?: number;
  analyticsEvents?: number;
  generationsByStatus?: Record<string, number>;
  pendingGenerations?: number;
  failedGenerations?: number;
}

/** Fetch operational health (admin-only). */
export async function fetchAdminOperations(actorId: string): Promise<AdminOperations | null> {
  const out = await invokeApi<AdminOperations>("admin_operations_get", {}, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result ?? {};
}

export interface AdminSecurity {
  auditEvents?: number;
  domainEvents?: number;
}

/** Fetch security/audit summary (admin-only). */
export async function fetchAdminSecurity(actorId: string): Promise<AdminSecurity | null> {
  const out = await invokeApi<AdminSecurity>("admin_security_get", {}, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result ?? {};
}

export interface Incident {
  $id?: string;
  severity?: string;
  status?: string;
  startedAt?: string;
  resolvedAt?: string;
  subsystem?: string;
  summary?: string;
  owner?: string;
  resolution?: string;
  createdAt?: string;
}

/** List incidents, newest first (admin-only). */
export async function fetchIncidents(actorId: string): Promise<Incident[]> {
  const out = await invokeApi<{ items?: Incident[] }>("incident_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface PlanProfitability {
  planId?: string;
  activeSubscribers?: number;
  mrrCents?: number;
}

/** Active subscribers + monthly revenue grouped by plan (admin-only). */
export async function fetchPlanProfitability(actorId: string): Promise<PlanProfitability[]> {
  const out = await invokeApi<{ items?: PlanProfitability[] }>("admin_plan_profitability", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface Alert {
  $id?: string;
  name?: string;
  metric?: string;
  operator?: string;
  threshold?: number;
  severity?: string;
  enabled?: boolean;
  lastTriggeredAt?: string;
}

/** List configured alerts (admin-only). */
export async function fetchAlerts(actorId: string): Promise<Alert[]> {
  const out = await invokeApi<{ items?: Alert[] }>("alert_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface AiCost {
  creditsReserved?: number;
  creditsSettled?: number;
  creditsRefunded?: number;
}

/** AI credit throughput (reserved/settled/refunded), admin-only. */
export async function fetchAiCost(actorId: string): Promise<AiCost | null> {
  const out = await invokeApi<AiCost>("admin_ai_cost", {}, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result ?? {};
}

export interface AlertEvaluation {
  alertId?: string;
  name?: string;
  metric?: string;
  value?: number;
  threshold?: number;
  triggered?: boolean;
}

/** Evaluate enabled alerts against current metrics (admin-only). */
export async function evaluateAlerts(actorId: string): Promise<AlertEvaluation[]> {
  const out = await invokeApi<{ items?: AlertEvaluation[] }>("alert_evaluate", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export async function fetchAdminRetention(actorId: string): Promise<RetentionSummary | null> {
  const out = await invokeApi<RetentionSummary>("admin_analytics_retention_get", {}, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result;
}

export async function fetchAdminFunnel(actorId: string): Promise<FunnelStep[]> {
  const out = await invokeApi<{ funnel?: FunnelStep[] }>("admin_analytics_funnel_get", {}, actorId);
  if (out.status !== "SUCCESS") return [];
  return out.result?.funnel ?? [];
}

export interface AcquisitionPoint {
  date: string;
  newActors: number;
}

export interface Cohort {
  date: string;
  size: number;
  d1: number;
  d3: number;
  d7: number;
}

export async function fetchAdminAcquisition(actorId: string): Promise<AcquisitionPoint[]> {
  const out = await invokeApi<{ series?: AcquisitionPoint[] }>("admin_analytics_acquisition_get", {}, actorId);
  if (out.status !== "SUCCESS") return [];
  return out.result?.series ?? [];
}

export async function fetchAdminCohorts(actorId: string): Promise<Cohort[]> {
  const out = await invokeApi<{ cohorts?: Cohort[] }>("admin_analytics_cohorts_get", {}, actorId);
  if (out.status !== "SUCCESS") return [];
  return out.result?.cohorts ?? [];
}

export interface ReaderManifestPage {
  $id?: string;
  position?: number;
  mediaAssetId?: string;
  text?: string;
  width?: number;
  height?: number;
  url?: string;
  accessClass?: string;
  denied?: boolean;
  deniedReasons?: string[];
}

export interface ReaderManifest {
  publication: {
    $id?: string;
    title?: string;
    type?: string;
    format?: string;
    readingFormat?: string;
    contentRating?: string;
    creatorId?: string;
  };
  pages: ReaderManifestPage[];
  entitlementDenied?: boolean;
  entitlementReasons?: string[];
  accessClass?: string;
}

/** Fetch a book publication's reader manifest (publication + authorized pages). */
export async function fetchReaderManifest(publicationId: string, actorId = ""): Promise<ReaderManifest | null> {
  const out = await invokeApi<ReaderManifest>("reader_manifest_get", { publicationId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.publication) return null;
  return out.result;
}

/** Fetch the authenticated user's saved reading position for a publication. */
export async function fetchReadingPosition(actorId: string, publicationId: string): Promise<number> {
  const out = await invokeApi<{ position?: number }>("reading_progress_get", { publicationId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return 0;
  return out.result.position ?? 0;
}

export interface PlanSummary {
  $id?: string;
  code?: string;
  name?: string;
  description?: string;
  status?: string;
  scope?: string;
  currency?: string;
  amount?: number;
  billingInterval?: string;
  billingIntervalCount?: number;
}

export interface SubscriptionSummary {
  $id?: string;
  userId?: string;
  creatorId?: string;
  planId?: string;
  planVersion?: number;
  provider?: string;
  providerSubscriptionId?: string;
  providerPlanId?: string;
  status?: string;
  billingMode?: string;
  billingStrategy?: string;
  currency?: string;
  amount?: number;
  billingInterval?: string;
  billingIntervalCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Fetch the available subscription plans (read-only catalog). */
export async function fetchPlans(actorId: string): Promise<PlanSummary[]> {
  const out = await invokeApi<{ rows?: PlanSummary[] }>("plan_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.rows) return [];
  return out.result.rows;
}

/** Fetch the authenticated user's subscriptions (scoped server-side). */
export async function fetchSubscriptions(actorId: string): Promise<SubscriptionSummary[]> {
  const out = await invokeApi<{ items?: SubscriptionSummary[] }>("subscription_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface SupportTicket {
  $id: string;
  userId?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Fetch the authenticated user's support tickets. */
export async function fetchSupportTickets(actorId: string): Promise<SupportTicket[]> {
  const out = await invokeApi<{ items?: SupportTicket[] }>("support_ticket_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch a single support ticket (scoped to the actor server-side). */
export async function fetchSupportTicket(actorId: string, ticketId: string): Promise<SupportTicket | null> {
  const out = await invokeApi<SupportTicket>("support_ticket_get", { ticketId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

/** Fetch a single user (admin-only). */
export async function fetchAdminUser(actorId: string, userId: string): Promise<AdminUser | null> {
  const out = await invokeApi<AdminUser>("admin_user_get", { userId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

/** Fetch a single publication (admin-only). */
export async function fetchAdminPublication(actorId: string, publicationId: string): Promise<Record<string, unknown> | null> {
  const out = await invokeApi<Record<string, unknown>>("admin_publication_get", { publicationId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

/** Fetch a single creator (admin-only). */
export async function fetchAdminCreator(actorId: string, creatorActorId: string): Promise<Record<string, unknown> | null> {
  const out = await invokeApi<Record<string, unknown>>("admin_creator_get", { actorId: creatorActorId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

export interface StoryBible {
  $id?: string;
  projectId?: string;
  premise?: string;
  themes?: string;
  tone?: string;
  updatedAt?: string;
}

/** Fetch a project's story bible (scoped to the actor server-side). */
export async function fetchStoryBible(actorId: string, projectId: string): Promise<StoryBible | null> {
  const out = await invokeApi<StoryBible>("story_bible_get", { projectId }, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result ?? {};
}

export interface Character {
  $id?: string;
  projectId?: string;
  name?: string;
  description?: string;
  status?: string;
}

/** List a project's characters (scoped to the actor server-side). */
export async function fetchCharacters(actorId: string, projectId: string): Promise<Character[]> {
  const out = await invokeApi<{ items?: Character[] }>("character_list", { projectId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface World {
  $id?: string;
  projectId?: string;
  name?: string;
  description?: string;
  locations?: string;
  rules?: string;
}

/** Fetch a project's world (scoped to the actor server-side). */
export async function fetchWorld(actorId: string, projectId: string): Promise<World | null> {
  const out = await invokeApi<World>("world_get", { projectId }, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result ?? {};
}

export interface StudioAsset {
  $id?: string;
  projectId?: string;
  mediaAssetId?: string;
  role?: string;
  label?: string;
}

/** List a project's assets (scoped to the actor server-side). */
export async function fetchAssets(actorId: string, projectId: string): Promise<StudioAsset[]> {
  const out = await invokeApi<{ items?: StudioAsset[] }>("asset_list", { projectId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** List all support tickets (admin-only). */
export async function fetchAdminSupportTickets(actorId: string): Promise<SupportTicket[]> {
  const out = await invokeApi<{ items?: SupportTicket[] }>("admin_support_ticket_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

/** Fetch a single support ticket (admin-only). */
export async function fetchAdminSupportTicket(actorId: string, ticketId: string): Promise<SupportTicket | null> {
  const out = await invokeApi<SupportTicket>("admin_support_ticket_get", { ticketId }, actorId);
  if (out.status !== "SUCCESS" || !out.result) return null;
  return out.result;
}

/** List a project's publications (all statuses, scoped to the actor). */
export async function fetchStudioPublications(actorId: string, projectId: string): Promise<Array<Record<string, unknown>>> {
  const out = await invokeApi<{ items?: Array<Record<string, unknown>> }>("studio_publication_list", { projectId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface PromptTemplate {
  $id?: string;
  id?: string;
  projectId?: string;
  name?: string;
  template?: string;
  variables?: string[];
  revision?: number;
}

/** List a project's prompt templates (scoped to the actor server-side). */
export async function fetchPromptTemplates(actorId: string, projectId: string): Promise<PromptTemplate[]> {
  const out = await invokeApi<{ items?: PromptTemplate[] }>("prompt_template_list", { projectId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface GenerationRequest {
  $id?: string;
  requestId?: string;
  projectId?: string;
  targetType?: string;
  billingMode?: string;
  executionLocation?: string;
  creditEligible?: boolean;
  creditEligibilityReason?: string;
  status?: string;
  prompt?: string;
  promptTemplateId?: string;
  draftId?: string;
  $createdAt?: string;
}

/** List a project's generation requests (scoped to the actor server-side). */
export async function fetchGenerations(actorId: string, projectId: string): Promise<GenerationRequest[]> {
  const out = await invokeApi<{ items?: GenerationRequest[] }>("generation_list", { projectId }, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface CreatorAnalytics {
  projects?: number;
  documents?: number;
  promptTemplates?: number;
  generationTotal?: number;
  generationCreditEligible?: number;
  generationsByBilling?: Record<string, number>;
}

/** Fetch the calling creator's own workspace metrics (scoped server-side). */
export async function fetchCreatorAnalytics(actorId: string): Promise<CreatorAnalytics | null> {
  const out = await invokeApi<CreatorAnalytics>("creator_analytics_get", {}, actorId);
  if (out.status !== "SUCCESS") return null;
  return out.result ?? {};
}

export interface AiProviderSummary {
  providerId?: string;
  displayName?: string;
  creditEligible?: boolean;
  creditCost?: number;
  status?: string;
}

/** List ACTIVE AI providers (scoped server-side). */
export async function fetchAiProviders(actorId: string): Promise<AiProviderSummary[]> {
  const out = await invokeApi<{ items?: AiProviderSummary[] }>("ai_provider_list", {}, actorId);
  if (out.status !== "SUCCESS" || !out.result?.items) return [];
  return out.result.items;
}

export interface AdminCategoryMetric {
  labelKey: MessageKey;
  value: string | number;
}

export interface AdminCategorySection {
  titleKey: MessageKey;
  entries: Record<string, number>;
}

export interface AdminCategoryData {
  metrics: AdminCategoryMetric[];
  sections: AdminCategorySection[];
}

function countBy(list: Array<Record<string, unknown>>, field: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of list) {
    const key = String(row[field] ?? "UNKNOWN");
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function metric(labelKey: MessageKey, value: string | number): AdminCategoryMetric {
  return { labelKey, value };
}

function section(titleKey: MessageKey, entries: Record<string, number>): AdminCategorySection {
  return { titleKey, entries };
}

/**
 * Server-authoritative per-category admin breakdown. Reuses the existing
 * admin_* gateway reads; categories without a backing data source return an
 * empty breakdown (rendered as a real empty state, never fabricated data).
 */
export async function fetchAdminCategory(actorId: string, category: string): Promise<AdminCategoryData> {
  const empty: AdminCategoryData = { metrics: [], sections: [] };

  switch (category) {
    case "advertising": {
      const campaigns = await fetchAdCampaigns();
      const placements = await fetchAdPlacements();
      return {
        metrics: [
          metric("admin.metric.campaigns", campaigns.length),
          metric("admin.metric.placements", placements.length),
        ],
        sections: [],
      };
    }
    case "ai": {
      const cost = await fetchAiCost(actorId);
      const ops = await fetchAdminOperations(actorId);
      const sections: AdminCategorySection[] = [];
      if (ops?.generationsByStatus) sections.push(section("admin.section.generationsByStatus", ops.generationsByStatus));
      return {
        metrics: [
          metric("admin.creditsReserved", cost?.creditsReserved ?? 0),
          metric("admin.creditsSettled", cost?.creditsSettled ?? 0),
          metric("admin.creditsRefunded", cost?.creditsRefunded ?? 0),
        ],
        sections,
      };
    }
    case "community": {
      const comments = await fetchAdminList("admin_comment_list", actorId);
      const byStatus = countBy(comments, "status");
      return {
        metrics: [metric("admin.metric.commentsCount", comments.length)],
        sections: Object.keys(byStatus).length ? [section("admin.section.contentByStatus", byStatus)] : [],
      };
    }
    case "content": {
      const a = await fetchAdminAnalytics(actorId);
      const sections: AdminCategorySection[] = [];
      if (a?.contentByType) sections.push(section("admin.section.contentByType", a.contentByType));
      if (a?.contentByStatus) sections.push(section("admin.section.contentByStatus", a.contentByStatus));
      return { metrics: [], sections };
    }
    case "creators": {
      const a = await fetchAdminAnalytics(actorId);
      const creators = await fetchAdminList("admin_creator_list", actorId);
      const sections: AdminCategorySection[] = [];
      if (a?.creatorsByStatus) sections.push(section("admin.section.creatorsByStatus", a.creatorsByStatus));
      return {
        metrics: [metric("admin.metric.creatorsCount", creators.length)],
        sections,
      };
    }
    case "marketing": {
      const acquisition = await fetchAdminAcquisition(actorId);
      const cohorts = await fetchAdminCohorts(actorId);
      const newActors = acquisition.reduce((sum, p) => sum + (p.newActors ?? 0), 0);
      return {
        metrics: [
          metric("admin.metric.newActors", newActors),
          metric("admin.metric.cohortsCount", cohorts.length),
        ],
        sections: [],
      };
    }
    case "operations": {
      const ops = await fetchAdminOperations(actorId);
      const sections: AdminCategorySection[] = [];
      if (ops?.generationsByStatus) sections.push(section("admin.section.generationsByStatus", ops.generationsByStatus));
      return {
        metrics: [
          metric("admin.domainEvents", ops?.domainEvents ?? 0),
          metric("admin.analyticsEvents", ops?.analyticsEvents ?? 0),
          metric("admin.pendingGenerations", ops?.pendingGenerations ?? 0),
          metric("admin.failedGenerations", ops?.failedGenerations ?? 0),
        ],
        sections,
      };
    }
    case "payments": {
      const a = await fetchAdminAnalytics(actorId);
      const sections: AdminCategorySection[] = [];
      if (a?.paymentsByProvider) sections.push(section("admin.section.paymentsByProvider", a.paymentsByProvider));
      if (a?.paymentsByStatus) sections.push(section("admin.section.paymentsByStatus", a.paymentsByStatus));
      return { metrics: [], sections };
    }
    case "reports": {
      const a = await fetchAdminAnalytics(actorId);
      const ops = await fetchAdminOperations(actorId);
      const sections: AdminCategorySection[] = [];
      if (a?.contentByStatus) sections.push(section("admin.section.contentByStatus", a.contentByStatus));
      if (a?.subscriptionsByStatus) sections.push(section("admin.section.subscriptionsByStatus", a.subscriptionsByStatus));
      if (a?.paymentsByStatus) sections.push(section("admin.section.paymentsByStatus", a.paymentsByStatus));
      if (a?.creatorsByStatus) sections.push(section("admin.section.creatorsByStatus", a.creatorsByStatus));
      if (ops?.generationsByStatus) sections.push(section("admin.section.generationsByStatus", ops.generationsByStatus));
      return { metrics: [], sections };
    }
    case "revenue": {
      const overview = await fetchAdminOverview(actorId);
      const k = overview?.kpis;
      return {
        metrics: [
          metric("admin.mrr", k ? `$${((k.mrrCents ?? 0) / 100).toFixed(2)}` : "$0.00"),
          metric("admin.revenue30d", k ? `$${((k.revenue30dCents ?? 0) / 100).toFixed(2)}` : "$0.00"),
          metric("admin.activePaidSubscribers", k?.activePaidSubscribers ?? 0),
          metric("admin.churned30d", k?.churned30d ?? 0),
        ],
        sections: [],
      };
    }
    case "subscriptions": {
      const a = await fetchAdminAnalytics(actorId);
      const sections: AdminCategorySection[] = [];
      if (a?.subscriptionsByStatus) sections.push(section("admin.section.subscriptionsByStatus", a.subscriptionsByStatus));
      return { metrics: [], sections };
    }
    case "support": {
      const tickets = await fetchAdminSupportTickets(actorId);
      const byStatus = countBy(tickets as unknown as Array<Record<string, unknown>>, "status");
      return {
        metrics: [metric("admin.metric.ticketsCount", tickets.length)],
        sections: Object.keys(byStatus).length ? [section("admin.section.contentByStatus", byStatus)] : [],
      };
    }
    case "consumerEconomics":
    case "consumer-economics": {
      const overview = await fetchAdminOverview(actorId);
      const k = overview?.kpis;
      return {
        metrics: [
          metric("admin.mrr", k ? `$${((k.mrrCents ?? 0) / 100).toFixed(2)}` : "$0.00"),
          metric("admin.revenue30d", k ? `$${((k.revenue30dCents ?? 0) / 100).toFixed(2)}` : "$0.00"),
          metric("admin.activePaidSubscribers", k?.activePaidSubscribers ?? 0),
          metric("admin.churned30d", k?.churned30d ?? 0),
        ],
        sections: [],
      };
    }
    case "consumption": {
      const cost = await fetchAiCost(actorId);
      return {
        metrics: [
          metric("admin.creditsReserved", cost?.creditsReserved ?? 0),
          metric("admin.creditsSettled", cost?.creditsSettled ?? 0),
          metric("admin.creditsRefunded", cost?.creditsRefunded ?? 0),
        ],
        sections: [],
      };
    }
    case "plans":
    case "pricing": {
      const plans = await fetchPlanProfitability(actorId);
      const totalSubs = plans.reduce((sum, p) => sum + (p.activeSubscribers ?? 0), 0);
      return {
        metrics: [
          metric("admin.metric.plansCount", plans.length),
          metric("admin.metric.totalActiveSubscribers", totalSubs),
        ],
        sections: [],
      };
    }
    case "unit-economics":
    case "unitEconomics": {
      const overview = await fetchAdminOverview(actorId);
      const k = overview?.kpis;
      const subs = k?.activePaidSubscribers ?? 0;
      const arpu = subs > 0 ? (k?.revenue30dCents ?? 0) / subs / 100 : 0;
      return {
        metrics: [
          metric("admin.mrr", k ? `$${((k.mrrCents ?? 0) / 100).toFixed(2)}` : "$0.00"),
          metric("admin.metric.arpu30d", `$${arpu.toFixed(2)}`),
        ],
        sections: [],
      };
    }
    case "anomalies": {
      const incidents = await fetchIncidents(actorId);
      const alerts = await fetchAlerts(actorId);
      const open = incidents.filter((i) => i.status !== "RESOLVED").length;
      return {
        metrics: [
          metric("admin.metric.openIncidents", open),
          metric("admin.metric.alertsCount", alerts.length),
        ],
        sections: [],
      };
    }
    case "governance":
    case "audit": {
      const sec = await fetchAdminSecurity(actorId);
      return {
        metrics: [
          metric("admin.auditEvents", sec?.auditEvents ?? 0),
          metric("admin.domainEventsOutbox", sec?.domainEvents ?? 0),
        ],
        sections: [],
      };
    }
    case "reserves": {
      const cost = await fetchAiCost(actorId);
      return {
        metrics: [metric("admin.creditsReserved", cost?.creditsReserved ?? 0)],
        sections: [],
      };
    }
    case "tax": {
      const a = await fetchAdminAnalytics(actorId);
      const sections: AdminCategorySection[] = [];
      if (a?.paymentsByProvider) sections.push(section("admin.section.paymentsByProvider", a.paymentsByProvider));
      return { metrics: [], sections };
    }
    case "supportOps": {
      const tickets = await fetchAdminSupportTickets(actorId);
      const byStatus = countBy(tickets as unknown as Array<Record<string, unknown>>, "status");
      return {
        metrics: [metric("admin.metric.ticketsCount", tickets.length)],
        sections: Object.keys(byStatus).length ? [section("admin.section.contentByStatus", byStatus)] : [],
      };
    }
    case "inbox":
    case "escalations": {
      const tickets = await fetchAdminSupportTickets(actorId);
      const byStatus = countBy(tickets as unknown as Array<Record<string, unknown>>, "status");
      return {
        metrics: [metric("admin.metric.ticketsCount", tickets.length)],
        sections: Object.keys(byStatus).length ? [section("admin.section.contentByStatus", byStatus)] : [],
      };
    }
    case "modReports": {
      const comments = await fetchAdminList("admin_comment_list", actorId);
      const byStatus = countBy(comments, "status");
      return {
        metrics: [metric("admin.metric.commentsCount", comments.length)],
        sections: Object.keys(byStatus).length ? [section("admin.section.contentByStatus", byStatus)] : [],
      };
    }
    case "refunds": {
      const payments = await fetchAdminList("admin_payment_list", actorId);
      return {
        metrics: [metric("admin.metric.paymentsCount", payments.length)],
        sections: [],
      };
    }
    default:
      // media, simulator, sla, knowledge, macros, supportSettings, function,
      // settings, mediaDistribution, pmAccess — no backing data source yet.
      return empty;
  }
}
