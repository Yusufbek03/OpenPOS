FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/offline-sync/package.json packages/offline-sync/
COPY packages/printer/package.json packages/printer/
COPY packages/websocket/package.json packages/websocket/
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN cd packages/database && npx prisma generate

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN cd apps/api && npx tsc

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
RUN mkdir -p apps/api/dist/uploads
EXPOSE 3000
CMD ["npx", "tsx", "apps/api/src/main.ts"]
