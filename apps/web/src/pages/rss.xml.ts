import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response('Site not configured', { status: 500 });

  const posts = await getCollection('posts', ({ data }) => data.status === 'published');

  const items = posts
    .map((p) => {
      const link = new URL(`/editorial/${p.id}`, site).toString();
      const pubDate = p.data.publishedAt ? `<pubDate>${p.data.publishedAt.toUTCString()}</pubDate>` : '';
      const description = p.data.description ? `<description>${escapeXml(p.data.description)}</description>` : '';
      return `  <item>
    <title>${escapeXml(p.data.title)}</title>
    <link>${link}</link>
    <guid>${link}</guid>
    ${description}
    ${pubDate}
  </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>StoryGalore</title>
    <link>${site}</link>
    <description>StoryGalore editorial posts.</description>
${items}
  </channel>
</rss>`;

  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml' } });
};
