FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@11.16.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN cd packages/database && npx prisma generate
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "tsx", "apps/api/src/main.ts"]
