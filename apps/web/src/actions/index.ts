import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { createHash, randomUUID } from "node:crypto";
import { createServerClient, createAdminClient, SESSION_COOKIE, ID } from "@storygalore/appwrite-client";
import { invokeApi } from "@/lib/gateway";

const endpoint = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
const projectId = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

function computeAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export const server = {
  login: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email(),
      password: z.string().min(8).max(256),
      returnTo: z.string().optional(),
    }),
    handler: async (input, context) => {
      const { account } = createServerClient({ endpoint, projectId });
      try {
        const session = await account.createEmailPasswordSession(input.email, input.password);
        context.cookies.set(SESSION_COOKIE, session.secret, sessionCookieOptions());
        return { ok: true, returnTo: input.returnTo ?? "/" };
      } catch {
        throw new ActionError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }
    },
  }),

  register: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1).max(128),
      email: z.string().email(),
      password: z.string().min(8).max(256),
    }),
    handler: async (input, context) => {
      const { account } = createServerClient({ endpoint, projectId });
      try {
        await account.create(ID.unique(), input.email, input.password, input.name);
        const session = await account.createEmailPasswordSession(input.email, input.password);
        context.cookies.set(SESSION_COOKIE, session.secret, sessionCookieOptions());
        return { ok: true };
      } catch {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Could not create your account. The email may already be in use.",
        });
      }
    },
  }),

  forgotPassword: defineAction({
    accept: "form",
    input: z.object({ email: z.string().email() }),
    handler: async (input, context) => {
      const { account } = createServerClient({ endpoint, projectId });
      try {
        const resetUrl = `${context.url.origin}/auth/reset-password`;
        await account.createRecovery(input.email, resetUrl);
      } catch {
        // Do not reveal whether the email exists.
      }
      return { ok: true };
    },
  }),

  resetPassword: defineAction({
    accept: "form",
    input: z.object({
      userId: z.string().min(1),
      secret: z.string().min(1),
      password: z.string().min(8).max(256),
    }),
    handler: async (input) => {
      const { account } = createServerClient({ endpoint, projectId });
      try {
        await account.updateRecovery(input.userId, input.secret, input.password);
        return { ok: true };
      } catch {
        throw new ActionError({ code: "BAD_REQUEST", message: "Invalid or expired reset link." });
      }
    },
  }),

  createSupportTicket: defineAction({
    accept: "form",
    input: z.object({
      subject: z.string().min(1).max(255),
      message: z.string().min(1).max(10000),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to contact support." });
      const out = await invokeApi(
        "support_ticket_create",
        { subject: input.subject, message: input.message },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not submit your request." });
      }
      return { ok: true };
    },
  }),

  saveStoryBible: defineAction({
    accept: "form",
    input: z.object({
      projectId: z.string().min(1),
      premise: z.string().max(5000),
      themes: z.string().max(2000),
      tone: z.string().max(2000),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("story_bible_upsert", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save the story bible." });
      }
      return { ok: true };
    },
  }),

  createCharacter: defineAction({
    accept: "form",
    input: z.object({
      projectId: z.string().min(1),
      name: z.string().min(1).max(255),
      description: z.string().max(5000),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("character_create", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not add the character." });
      }
      return { ok: true };
    },
  }),

  saveWorld: defineAction({
    accept: "form",
    input: z.object({
      projectId: z.string().min(1),
      name: z.string().max(255),
      description: z.string().max(5000),
      locations: z.string().max(10000),
      rules: z.string().max(10000),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("world_upsert", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save the world." });
      }
      return { ok: true };
    },
  }),

  createPromptTemplate: defineAction({
    accept: "form",
    input: z.object({
      projectId: z.string().min(1),
      name: z.string().min(1).max(255),
      template: z.string().min(1).max(20000),
      variables: z.string().max(2000),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const variables = input.variables.split(",").map((v) => v.trim()).filter(Boolean);
      const out = await invokeApi("prompt_template_create", {
        projectId: input.projectId,
        name: input.name,
        template: input.template,
        variables,
      }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create the prompt template." });
      }
      return { ok: true };
    },
  }),

  requestGeneration: defineAction({
    accept: "form",
    input: z.object({
      projectId: z.string().min(1),
      targetType: z.enum(["PAGE", "PANEL", "IMAGE", "CHARACTER", "BACKGROUND", "DIALOGUE", "STORY_TEXT", "VIDEO"]),
      prompt: z.string().max(20000),
      promptTemplateId: z.string().max(255),
      billingMode: z.enum(["PLATFORM_CREDITS", "BYOK", "USER_HOSTED"]),
      executionLocation: z.enum(["CLOUD", "USER_HOSTED"]),
      duration: z.string().max(3),
      resolution: z.string().max(16),
      aspectRatio: z.string().max(16),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const requestId = randomUUID();
      const payload: Record<string, unknown> = {
        requestId,
        projectId: input.projectId,
        targetType: input.targetType,
        billingMode: input.billingMode,
        executionLocation: input.executionLocation,
        policyContext: {
          source: "studio",
          billingMode: input.billingMode,
          executionLocation: input.executionLocation,
        },
      };
      if (input.prompt) payload.prompt = input.prompt;
      if (input.promptTemplateId) payload.promptTemplateId = input.promptTemplateId;
      if (input.duration) {
        const d = Number(input.duration);
        if (Number.isFinite(d) && d > 0) payload.duration = d;
      }
      if (input.resolution) payload.resolution = input.resolution;
      if (input.aspectRatio) payload.aspectRatio = input.aspectRatio;
      const out = await invokeApi("generation_create", payload, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not submit the generation request." });
      }
      return { ok: true, requestId };
    },
  }),

  updateSupportTicket: defineAction({
    accept: "form",
    input: z.object({
      ticketId: z.string().min(1),
      status: z.enum(["OPEN", "CLOSED"]),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("admin_support_ticket_update", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not update the ticket." });
      }
      return { ok: true };
    },
  }),

  logout: defineAction({
    accept: "form",
    handler: async (_, context) => {
      const session = context.cookies.get(SESSION_COOKIE)?.value;
      if (session) {
        try {
          const { account } = createServerClient({ endpoint, projectId }, { session });
          await account.deleteSession("current");
        } catch {
          // Session already gone; proceed to clear the cookie.
        }
      }
      context.cookies.delete(SESSION_COOKIE, { path: "/" });
      return { ok: true };
    },
  }),

  saveReadingProgress: defineAction({
    accept: "json",
    input: z.object({
      publicationId: z.string().min(1),
      position: z.number().int().min(0),
      percentComplete: z.number().min(0).max(100),
      pageId: z.string().optional(),
      episodeId: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to save progress." });
      const out = await invokeApi(
        "reading_progress_upsert",
        {
          publicationId: input.publicationId,
          position: input.position,
          percentComplete: input.percentComplete,
          pageId: input.pageId,
          episodeId: input.episodeId,
        },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save progress." });
      }
      return { ok: true };
    },
  }),

  becomeCreator: defineAction({
    accept: "form",
    input: z.object({
      handle: z.string().min(1).max(255),
      displayName: z.string().min(1).max(255),
      bio: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to become a creator." });
      const out = await invokeApi(
        "creator_create",
        { handle: input.handle, displayName: input.displayName, bio: input.bio ?? "" },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not create your creator profile." });
      }
      return { ok: true };
    },
  }),

  createProject: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to create a project." });
      const out = await invokeApi(
        "studio_project_create",
        { workspaceId: user.$id, name: input.name, description: input.description ?? undefined },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not create the project." });
      }
      return { ok: true };
    },
  }),

  createDocument: defineAction({
    accept: "form",
    input: z.object({
      projectId: z.string().min(1),
      type: z.enum(["BOOK", "POST", "VIDEO", "AUDIO", "MIXED"]),
      title: z.string().optional(),
      format: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to create a document." });
      const out = await invokeApi(
        "document_create",
        { projectId: input.projectId, type: input.type, title: input.title ?? "", format: input.format ?? undefined },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not create the document." });
      }
      return { ok: true };
    },
  }),

  restoreRevision: defineAction({
    accept: "form",
    input: z.object({
      documentId: z.string().min(1),
      targetRevisionId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("draft_revision_restore", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not restore the revision." });
      }
      return { ok: true };
    },
  }),

  createIncident: defineAction({
    accept: "form",
    input: z.object({
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      subsystem: z.string().min(1).max(255),
      summary: z.string().min(1).max(5000),
      owner: z.string().max(255),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("incident_create", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create the incident." });
      }
      return { ok: true };
    },
  }),

  updateIncident: defineAction({
    accept: "form",
    input: z.object({
      incidentId: z.string().min(1),
      status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED"]),
      resolution: z.string().max(5000),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("incident_update", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not update the incident." });
      }
      return { ok: true };
    },
  }),

  createAlert: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1).max(255),
      metric: z.string().min(1).max(255),
      operator: z.string().min(1).max(16),
      threshold: z.coerce.number().int(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("alert_create", input, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create the alert." });
      }
      return { ok: true };
    },
  }),

  updateAlert: defineAction({
    accept: "form",
    input: z.object({
      alertId: z.string().min(1),
      enabled: z.enum(["true", "false"]),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("alert_update", { alertId: input.alertId, enabled: input.enabled === "true" }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not update the alert." });
      }
      return { ok: true };
    },
  }),

  evaluateAlerts: defineAction({
    accept: "form",
    handler: async (_, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
      const out = await invokeApi("alert_evaluate", {}, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Could not evaluate alerts." });
      }
      return { ok: true };
    },
  }),

  updateDocument: defineAction({
    accept: "form",
    input: z.object({
      documentId: z.string().min(1),
      title: z.string().optional(),
      format: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to edit." });
      const out = await invokeApi(
        "document_update",
        { documentId: input.documentId, title: input.title ?? undefined, format: input.format ?? undefined },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not update the document." });
      }
      return { ok: true };
    },
  }),

  addPage: defineAction({
    accept: "form",
    input: z.object({
      documentId: z.string().min(1),
      position: z.coerce.number().int().min(0),
      width: z.coerce.number().int().min(1).optional(),
      height: z.coerce.number().int().min(1).optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to edit." });
      const out = await invokeApi(
        "page_create",
        {
          documentId: input.documentId,
          position: input.position,
          width: input.width ?? undefined,
          height: input.height ?? undefined,
        },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not add the page." });
      }
      return { ok: true };
    },
  }),

  deletePage: defineAction({
    accept: "form",
    input: z.object({ pageId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi("page_delete", { pageId: input.pageId }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not delete the page." });
      }
      return { ok: true };
    },
  }),

  addPanel: defineAction({
    accept: "form",
    input: z.object({
      pageId: z.string().min(1),
      position: z.coerce.number().int().min(0).optional(),
      shape: z.enum(["RECTANGLE", "ROUNDED", "CIRCLE", "CUSTOM"]).optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const panel = {
        bounds: { x: 0, y: 0, width: 800, height: 1200 },
        shape: input.shape ?? "RECTANGLE",
        layers: [],
      };
      const out = await invokeApi(
        "panel_create",
        { pageId: input.pageId, position: input.position ?? undefined, panel },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not add the panel." });
      }
      return { ok: true };
    },
  }),

  deletePanel: defineAction({
    accept: "form",
    input: z.object({ panelId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi("panel_delete", { panelId: input.panelId }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not delete the panel." });
      }
      return { ok: true };
    },
  }),

  updatePanel: defineAction({
    accept: "form",
    input: z.object({
      panelId: z.string().min(1),
      x: z.coerce.number().min(0),
      y: z.coerce.number().min(0),
      width: z.coerce.number().positive(),
      height: z.coerce.number().positive(),
      shape: z.enum(["RECTANGLE", "ROUNDED", "CIRCLE", "CUSTOM"]).optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const bounds = { x: input.x, y: input.y, width: input.width, height: input.height };
      const out = await invokeApi(
        "panel_update",
        { panelId: input.panelId, bounds, shape: input.shape ?? undefined },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not update the panel." });
      }
      return { ok: true };
    },
  }),

  publishPublication: defineAction({
    accept: "form",
    input: z.object({
      documentId: z.string().min(1),
      title: z.string().optional(),
      description: z.string().optional(),
      contentRating: z.enum(["ALL_AGES", "TEEN", "ADULT_18_PLUS"]).optional(),
      contentOrigin: z.enum(["HUMAN", "AI_ASSISTED", "AI_GENERATED", "HYBRID"]).optional(),
      accessClass: z.enum(["FREE", "SUBSCRIPTION", "PURCHASE"]).optional(),
      coverMediaAssetId: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to publish." });
      const validation = await invokeApi<{
        valid?: boolean;
        violations?: Array<{ code: string; message: string }>;
      }>("publication_validate", { documentId: input.documentId }, user.$id);
      if (validation.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not validate the document." });
      }
      if (!validation.result?.valid) {
        const msgs = (validation.result?.violations ?? []).map((v) => v.message).join(" ");
        throw new ActionError({ code: "BAD_REQUEST", message: msgs || "The document is not ready to publish." });
      }
      const out = await invokeApi<{ publicationId?: string }>(
        "publication_publish",
        {
          documentId: input.documentId,
          publicationMetadata: {
            title: input.title ?? undefined,
            description: input.description ?? undefined,
            contentRating: input.contentRating ?? undefined,
            contentOrigin: input.contentOrigin ?? undefined,
            accessClass: input.accessClass ?? undefined,
            coverMediaAssetId: input.coverMediaAssetId ?? undefined,
          },
        },
        user.$id,
      );
      if (out.status !== "SUCCESS" || !out.result?.publicationId) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not publish the document." });
      }
      return { ok: true, publicationId: out.result.publicationId };
    },
  }),

  uploadMedia: defineAction({
    accept: "form",
    input: z.object({
      file: z.instanceof(File),
      contentRating: z.enum(["ALL_AGES", "TEEN", "ADULT_18_PLUS"]).optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to upload." });
      const file = input.file;
      const mimeType = file.type || "image/png";

      const init = await invokeApi<{ mediaAssetId?: string; bucketKey?: string; fileId?: string }>(
        "media_upload_initiate",
        { mediaType: "IMAGE", declaredMimeType: mimeType, declaredSizeBytes: file.size },
        user.$id,
      );
      if (init.status !== "SUCCESS" || !init.result?.mediaAssetId || !init.result?.bucketKey || !init.result?.fileId) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not initiate the upload." });
      }

      const apiKey = import.meta.env.APPWRITE_API_KEY;
      const { storage } = createAdminClient({ endpoint, projectId }, apiKey);
      await storage.createFile(init.result.bucketKey, init.result.fileId, file, ['read("any")']);

      const bytes = Buffer.from(await file.arrayBuffer());
      const checksum = createHash("sha256").update(bytes).digest("hex");

      const complete = await invokeApi(
        "media_upload_complete",
        { mediaAssetId: init.result.mediaAssetId, mimeType, sizeBytes: file.size, checksumSha256: checksum },
        user.$id,
      );
      if (complete.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not complete the upload." });
      }
      return { ok: true, mediaAssetId: init.result.mediaAssetId };
    },
  }),

  attachPageBackground: defineAction({
    accept: "form",
    input: z.object({
      pageId: z.string().min(1),
      backgroundAssetId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi("page_update", { pageId: input.pageId, backgroundAssetId: input.backgroundAssetId }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not attach the asset." });
      }
      return { ok: true };
    },
  }),

  updateCreatorProfile: defineAction({
    accept: "form",
    input: z.object({
      avatarMediaAssetId: z.string().optional(),
      coverMediaAssetId: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi(
        "creator_update",
        {
          actorId: user.$id,
          avatarMediaAssetId: input.avatarMediaAssetId ?? undefined,
          coverMediaAssetId: input.coverMediaAssetId ?? undefined,
        },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not update your profile." });
      }
      return { ok: true };
    },
  }),

  createAdCampaign: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1),
      placementKeys: z.string().min(1),
      priority: z.coerce.number().int().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const placementIds = input.placementKeys.split(",").map((s) => s.trim()).filter(Boolean);
      if (placementIds.length === 0) throw new ActionError({ code: "BAD_REQUEST", message: "Select at least one placement." });
      const cr = await invokeApi<{ creativeId?: string }>(
        "ad_creative_create",
        { campaignId: "pending", assetType: "IMAGE", name: `${input.name} creative` },
        user.$id,
      );
      if (cr.status !== "SUCCESS" || !cr.result?.creativeId) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not create the creative." });
      }
      const out = await invokeApi(
        "ad_campaign_create",
        { name: input.name, placementIds, creativeIds: [cr.result.creativeId], priority: input.priority ?? 0 },
        user.$id,
      );
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not create the campaign." });
      }
      return { ok: true };
    },
  }),

  setAdCampaignStatus: defineAction({
    accept: "form",
    input: z.object({
      campaignId: z.string().min(1),
      status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi("ad_campaign_set_status", { campaignId: input.campaignId, status: input.status }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not update the campaign." });
      }
      return { ok: true };
    },
  }),

  updateAdultSettings: defineAction({
    accept: "form",
    input: z.object({
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      adultContentOptIn: z.enum(["true", "false"]),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const dob = new Date(`${input.dateOfBirth}T00:00:00Z`);
      if (isNaN(dob.getTime()) || dob.getTime() > Date.now()) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Enter a valid date of birth." });
      }
      const optIn = input.adultContentOptIn === "true";
      if (optIn && computeAge(dob) < 18) {
        throw new ActionError({ code: "BAD_REQUEST", message: "You must be 18 or older to enable adult content." });
      }
      const session = context.cookies.get(SESSION_COOKIE)?.value;
      if (!session) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const { account } = createServerClient({ endpoint, projectId }, { session });
      await account.updatePrefs({ dateOfBirth: input.dateOfBirth, adultContentOptIn: optIn });
      return { ok: true };
    },
  }),

  subscribe: defineAction({
    accept: "form",
    input: z.object({
      planId: z.string().min(1),
      provider: z.enum(["STRIPE", "NOWPAYMENTS"]),
      email: z.string().email().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to subscribe." });
      const billingMode = input.provider === "STRIPE" ? "FIAT" : "CRYPTO";
      const out = await invokeApi<{ subscriptionId?: string }>(
        "subscription_create",
        {
          userId: user.$id,
          planId: input.planId,
          planVersion: 1,
          billingMode,
          billingStrategy: "NATIVE_RECURRING",
          provider: input.provider,
          email: input.email ?? undefined,
        },
        user.$id,
      );
      if (out.status !== "SUCCESS" || !out.result?.subscriptionId) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not create the subscription." });
      }
      return { ok: true };
    },
  }),

  cancelSubscription: defineAction({
    accept: "form",
    input: z.object({ subscriptionId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi("subscription_cancel", { subscriptionId: input.subscriptionId }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not cancel the subscription." });
      }
      return { ok: true };
    },
  }),

  pauseSubscription: defineAction({
    accept: "form",
    input: z.object({ subscriptionId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi("subscription_pause", { subscriptionId: input.subscriptionId }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not pause the subscription." });
      }
      return { ok: true };
    },
  }),

  resumeSubscription: defineAction({
    accept: "form",
    input: z.object({ subscriptionId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in." });
      const out = await invokeApi("subscription_resume", { subscriptionId: input.subscriptionId }, user.$id);
      if (out.status !== "SUCCESS") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Could not resume the subscription." });
      }
      return { ok: true };
    },
  }),
};
