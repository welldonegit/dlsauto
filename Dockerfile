# syntax=docker/dockerfile:1

# One image, two runtime targets: `web` (Next standalone) and `worker`.
# Rationale (README): a single build graph guarantees identical dependency
# versions for both processes and one CI build; the targets differ only in what
# they ship and the command they run.

ARG NODE_VERSION=22.16.0

# ---------------------------------------------------------------------------
# base — Node + pnpm
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# deps — full dependency set (for building)
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# prod-deps — runtime-only dependencies (for the worker)
# ---------------------------------------------------------------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ---------------------------------------------------------------------------
# builder — compile the Next app (standalone output)
# ---------------------------------------------------------------------------
FROM base AS builder
ARG BUILD_SHA=dev
ENV NODE_OPTIONS=--no-deprecation
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BUILD_SHA=${BUILD_SHA}
ENV BUILD_SHA=${BUILD_SHA}
# Dummy secret so Payload config sanitizes at build time; no DB access needed.
ENV PAYLOAD_SECRET=build-only-secret
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# web — Next.js runtime (standalone, non-root)
# ---------------------------------------------------------------------------
FROM base AS web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
USER node
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

# ---------------------------------------------------------------------------
# worker — background process (tsx runtime, non-root)
# ---------------------------------------------------------------------------
FROM base AS worker
ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-deprecation
ENV WORKER_PORT=3001
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json tsconfig.json ./
COPY --chown=node:node src ./src
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.WORKER_PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["pnpm", "worker"]
