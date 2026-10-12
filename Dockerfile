# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
FROM dependencies AS development
COPY --chown=node:node . .
RUN mkdir -p /config /app/.gev-cache /app/.gev-logs && chown node:node /app /config /app/node_modules /app/.gev-cache /app/.gev-logs
USER node
CMD ["node", "docker/serve.mjs", "--dev"]
FROM dependencies AS build
COPY . .
RUN npm run build -- --config docker/vite.config.mjs
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app
# Vite and its provider plugins are runtime dependencies of this local server.
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /config /app/.gev-cache /app/.gev-logs && chown node:node /config /app/.gev-cache /app/.gev-logs
USER node
EXPOSE 4173
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=6 CMD ["node", "docker/healthcheck.mjs"]
CMD ["node", "docker/serve.mjs"]

# Browser tooling stays out of the production image.
FROM development AS test
USER root
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/* && git config --system --add safe.directory /app
USER node
FROM test AS qa
USER root
RUN apt-get update && apt-get install -y --no-install-recommends chromium && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
USER node
