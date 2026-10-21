import type { APIRoute } from "astro";
import { invokeApi } from "@/lib/gateway";

/**
 * Authorize and stream a CBZ/PDF export. The export is generated server-side
 * only when the publication's download policy and the actor's entitlement allow
 * it; the browser never decides eligibility.
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const { publicationId, format } = params;
  if (!publicationId || (format !== "CBZ" && format !== "PDF")) {
    return new Response("Not found", { status: 404 });
  }
  const actorId = locals.user?.$id ?? "";
  const out = await invokeApi<{ denied?: boolean; url?: string }>(
    "publication_export_request",
    { publicationId, format },
    actorId,
  );
  if (out.status !== "SUCCESS" || out.result?.denied || !out.result?.url) {
    return new Response("Download unavailable for this publication.", { status: 403 });
  }
  return Response.redirect(out.result.url, 302);
};
