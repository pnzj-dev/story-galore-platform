# syntax=docker/dockerfile:1
# apps/admin — SvelteKit + @sveltejs/adapter-node, deployed to Fly.io (intranet-bound).
FROM node:22-slim

RUN npm install -g pnpm@9

WORKDIR /repo
COPY . .

# Build the admin app (and its workspace deps) from the monorepo root.
RUN pnpm install --frozen-lockfile && pnpm --filter @storygalore/admin build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
CMD ["node", "apps/admin/build/index.js"]
