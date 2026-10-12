FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --no-audit --no-fund
COPY next.config.ts next-env.d.ts tsconfig.json ./
COPY src ./src
COPY contracts/types.d.ts ./contracts/types.d.ts
COPY public ./public
COPY scripts/auth-migrate.ts scripts/prepare-runtime.ts scripts/release-compatibility.ts ./scripts/
COPY migrations ./migrations
COPY contracts/source.json ./contracts/source.json
RUN npm run build && mkdir -p .next/standalone/.next/cache

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:9eeb7f5887d0e239e78264b06f7f11d2e14be534050481803a9e4728fcdd278e AS runtime
LABEL org.opencontainers.image.source="https://github.com/gonzalomartinperez/portfolio-assistant-backoffice"
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY LICENSE ./LICENSE
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
ENV PATH=/nodejs/bin:/usr/local/bin:/usr/bin:/bin
COPY --from=build --chown=65532:65532 /app/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=build --chown=65532:65532 /app/public ./public
COPY --from=build --chown=65532:65532 /app/scripts/release-compatibility.ts ./scripts/release-compatibility.ts
COPY --from=build --chown=65532:65532 /app/contracts/source.json ./contracts/source.json
USER 65532:65532
ENTRYPOINT []
STOPSIGNAL SIGTERM
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/ready',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
