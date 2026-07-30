FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN cd packages/database && npx prisma generate
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "tsx", "apps/api/src/main.ts"]
