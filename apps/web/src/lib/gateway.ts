import type { MediaType, ContentRating, MediaCardData, CreatorCardData } from "@storygalore/ui";

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
  creatorName?: string;
}

const VALID_TYPES: MediaType[] = ["BOOK", "POST", "VIDEO", "AUDIO", "MIXED"];

/**
 * Invoke the `api` gateway function synchronously (server-side only).
 * Uses the narrowly-scoped server API key; never call from the browser.
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
      return {
        id: progress.publicationId,
        title: pub.title ?? "Untitled",
        type,
        format: pub.format,
        contentRating: pub.contentRating as ContentRating | undefined,
        coverUrl: item.coverUrl,
        creatorName: item.creatorName,
        progress: {
          percentComplete: progress.percentComplete ?? 0,
          label: progress.position != null ? `Page ${progress.position + 1}` : undefined,
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
        creatorName: item.creatorName,
      } satisfies MediaCardData;
    });
}

/** Fetch published publications filtered by media type and/or format (browse). */
export async function fetchMediaByType(
  type: string,
  format?: string,
  sort: "trending" | "new" = "trending",
): Promise<MediaCardData[]> {
  const out = await invokeApi<{ items?: PublicationItem[] }>(
    "publication_list",
    { sort, type, format },
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
        creatorName: item.creatorName,
      } satisfies MediaCardData;
    });
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
  };
  media: Array<{ mediaId: string; allowed: boolean; url?: string }>;
  entitled: boolean;
  accessClass?: string;
  coverUrl?: string;
  creatorName?: string;
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
  };
  pages: ReaderManifestPage[];
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
