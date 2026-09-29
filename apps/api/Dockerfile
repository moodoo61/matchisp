FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
COPY prisma ./prisma
RUN pnpm install --filter @isp/api... --frozen-lockfile=false

FROM base AS build
COPY --from=deps /app /app
COPY apps/api ./apps/api
COPY packages ./packages
COPY prisma ./prisma
COPY .env.example ./.env
WORKDIR /app
RUN pnpm --filter @isp/shared build \
  && pnpm --filter @isp/api prisma:generate \
  && pnpm --filter @isp/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
