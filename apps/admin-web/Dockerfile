FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages ./packages
COPY apps/admin-web/package.json ./apps/admin-web/package.json
RUN pnpm install --filter @isp/admin-web... --frozen-lockfile=false

FROM base AS build
COPY --from=deps /app /app
COPY apps/admin-web ./apps/admin-web
COPY packages ./packages
WORKDIR /app
RUN pnpm --filter @isp/shared build && pnpm --filter @isp/admin-web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/admin-web/.next/standalone ./
COPY --from=build /app/apps/admin-web/.next/static ./apps/admin-web/.next/static
COPY --from=build /app/apps/admin-web/public ./apps/admin-web/public
EXPOSE 4010
ENV PORT=4010
CMD ["node", "apps/admin-web/server.js"]
