FROM oven/bun:1.1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ ./src/
RUN bun run build

FROM base AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY package.json ./

ENV MCP_PORT=3000
ENV MCP_HOST=0.0.0.0
ENV MCP_LOG_LEVEL=info

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

USER bun
CMD ["bun", "run", "src/index.ts"]
