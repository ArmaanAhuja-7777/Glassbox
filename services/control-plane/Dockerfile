# Build context: the repository root (the control plane depends on workspace packages).
#   docker build -f services/control-plane/Dockerfile --build-arg FLOWCANVAS_COMMIT=$(git rev-parse HEAD) -t flowcanvas-control-plane .

FROM node:24-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @flowcanvas/control-plane...
RUN pnpm exec turbo run build --filter=@flowcanvas/control-plane
RUN pnpm --filter @flowcanvas/control-plane deploy --prod /out

FROM node:24-slim AS runtime
ARG FLOWCANVAS_COMMIT=""
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    FLOWCANVAS_COMMIT=${FLOWCANVAS_COMMIT}
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
