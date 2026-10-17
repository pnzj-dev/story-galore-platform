import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response('Site not configured', { status: 500 });

  const posts = await getCollection('posts', ({ data }) => data.status === 'published');
  const urls = [
    { path: '/', priority: '1.0' },
    { path: '/discover', priority: '0.8' },
    ...posts.map((p) => ({ path: `/editorial/${p.id}`, priority: '0.6' })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site}${u.path}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
