import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro:schema';

/**
 * Repository-backed editorial content. Content Collections are NOT the
 * authoritative runtime domain state (see contracts/astro/content-contract.yaml);
 * Appwrite remains authoritative for users, publications, entitlements, etc.
 */

const status = z.enum(['draft', 'published']).default('draft');

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    slug: z.string().optional(),
    author: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    language: z.string().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    status,
    adult: z.boolean().default(false),
    canonical: z.string().optional(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    slug: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    language: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status,
  }),
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/announcements' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    slug: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
    language: z.string().optional(),
    status,
  }),
});

const help = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/help' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    language: z.string().optional(),
    category: z.string().optional(),
    updatedAt: z.coerce.date().optional(),
    status,
  }),
});

const changelog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/changelog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    version: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
    language: z.string().optional(),
  }),
});

export const collections = { posts, guides, announcements, help, changelog };
