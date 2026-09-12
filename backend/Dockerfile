FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY drizzle ./drizzle
COPY src ./src
EXPOSE 3000
# Migrations run on boot: one container owns the schema, so there is no race.
CMD ["sh", "-c", "bun src/db/migrate.ts && bun src/index.ts"]
