# Frontend image verification and operations handoff

Decision: [ADR 002](adrs/002-shared-vps.md). The private vps-ops repository owns shared production
composition, Coolify orchestration and the operational runbook. The canonical application runtime contract is [deployment-contract.md](deployment-contract.md).
This document records local verification and the
remaining shared-stack acceptance criteria; do not copy a production stack into this repo.

## Build and runtime contract

```sh
nvm use
npm ci
docker build -t portfolio-assistant-web:rc .
docker run --rm --read-only --tmpfs /tmp \
  --tmpfs /app/.next/cache:uid=1000,gid=1000,mode=0700,size=32m --cap-drop ALL \
  --security-opt no-new-privileges -p 127.0.0.1:3108:3000 portfolio-assistant-web:rc
```

The pinned Node 24 Debian slim multi-stage image builds Next standalone with the frozen
lockfile, then copies only traced runtime files, `.next/static` and `public`. UID/GID
1000 runs `node server.js`; exec-form termination reaches Node. Port 3000 and `/` are the
health contract. Docker checks every 30s (5s timeout, 20s start period, three failures).
The shell/static asset test does not establish API readiness. Fonts download during build;
no external font requests occur at runtime. Builds therefore require network access.

The existing Next Image avatar uses a **32 MiB ephemeral tmpfs at `/app/.next/cache`**,
owned by UID/GID 1000, mode 0700. This avoids failed optimizer writes on a read-only root
and preserves smaller responsive image transfers. `/tmp` is also writable. Neither path
contains session credentials or conversation storage; no persistent frontend volume is
required. Future ISR or additional optimized assets require a cache capacity review.
Runtime `PORT`/`HOSTNAME` configure listening,
not browser routing. Production has no `NEXT_PUBLIC_ASSISTANT_API_URL`; relative API calls
are compiled in. `.env*`, Git, node_modules and local integration checkouts are excluded
from the image context. Never inject server secrets into public build arguments.

For the shared stack use an immutable `ghcr.io/...@sha256:...` after the manual release
workflow publishes a verified image; `release.json` records frontend/API revisions.
A local image ID is not a registry manifest digest. This assignment does not publish a
production release. Set restart `unless-stopped`, 20s stop grace, read-only root, tmpfs,
all capabilities dropped and no-new-privileges. Rotate JSON logs (suggest 10 MiB ×3).
Use project-scoped service/network/volume names, no `container_name`, no web host port.

## Proxy contract and tests

Production must preserve `/api/v1/...` without rewriting; empty FastAPI root_path.
Disable response/request buffering and cache for `/api/`, use HTTP/1.1, omit Connection,
forward original Host/protocol and overwrite rather than append client-supplied forwarded
addresses. API trust must list actual immediate proxy peers, never `*`. Request size
32 KiB, body read 15s, upstream read/send 135s are the tested baseline; the API deadline is
at most 120s. The API emits heartbeat comments after 15s of silence; the proxy does not fabricate them. Proxy idle limits must exceed the maximum
silent provider period; reevaluate if API deadlines change.

`tests/integration/nginx.conf` exercises these HTTP settings locally. Production TLS,
HSTS after HTTPS validation, framing denial, nosniff, referrer policy, trusted peer addresses
and any CSP must be implemented/tested in the vps-ops-owned edge configuration. Never cache
sessions, conversations, mutations or SSE in the proxy/CDN. Do not apply static-asset cache
rules to `/api/`. Sensitive bodies/cookies must not enter access logs or failure artifacts.

```sh
# Docker, Git and Node 24; no API keys. Dedicated project and only loopback port 3001.
bash scripts/integration-up.sh
npx playwright install --with-deps chromium
npx playwright test --config playwright.live.config.ts
node scripts/proxy-smoke.mjs
docker compose -p assistant-web-verification -f tests/integration/compose.yaml stop
```

The script checks out immutable upstream revisions into ignored `.integration`, verifies
contract bytes, builds the API and initializes isolated PostgreSQL/Neo4j with fixture
providers. It never uses another agent's worktree or containers. Stop only this project;
do not use `down -v`. Local HTTP cookies intentionally lack Secure; HTTPS/__Host behavior
must be checked on the eventual TLS environment. Smoke tests cover preserved path, body
limit, host cookie, origin/CSRF rejection, portfolio CORS, SSE events plus a delayed upstream probe proving delivery before completion, disconnect /
explicit cancellation and deletion. Normal fixture responses can win a cancellation race;
no zero-interruption or provider cancellation timing claim follows from that test.

## Shared resource and operational roadmap

Start frontend at a **512 MiB / 1 vCPU ceiling**, then measure idle, concurrent sessions,
long output and rolling restart. This is a proposed ceiling, not a measured VPS capacity.
vps-ops should budget API, PostgreSQL and Neo4j separately; reserve at least 25% of actual
provisioned RAM and CPU capacity for OS, proxy, backups and other projects before assigning
assistant limits. Confirm KVM 4's purchased specifications rather than embedding a possibly
changed product table. Record RSS, CPU, disk, active connections, first-delta and p95 latency;
reduce concurrency or scale when sustained >70% of allocated memory/CPU, disk >75%, or
latency/readiness breaches the agreed SLO. Local measurements are in the verification report.

The canonical shared runbook must cover, before release:

1. Supported OS/Docker updates, non-root administration, SSH keys, restricted admin ingress,
   firewall, clock sync, registry pull credentials and isolated project storage.
2. Approved DNS/TLS and single-proxy routing, exact origins/secure cookies, secret files
   outside Git/images, reviewed forwarded trust, health/readiness and request limits.
3. Compatibility manifest for web/API/corpus/migrations; explicit one-shot backward-compatible
   migrations, no automatic migration on frontend startup. Back up before changing data.
4. Encrypted off-server PostgreSQL backups, approved key custody/retention, tested restore
   to a separate database, Neo4j rebuild/offline backup and recovery time measurement.
5. Alerts for readiness, failures, disk/log growth, cleanup backlog and resource pressure;
   log rotation, patch schedule, corpus retention and regular restore drills.
6. Approval-gated serialized deployment of tested digests, actual session/SSE smoke, then
   rollback to a known compatible image pair if readiness fails. Application rollback does
   not undo migrations; incompatible data needs the reviewed restore/recovery procedure.

VPS-only verification: TLS/cookies/security headers, real forwarded peer trust, firewall,
backup restore, representative load alongside other projects and SIGTERM during active
streams. If Cloudflare proxying is selected, test idle/total stream limits, buffering,
cache bypass and disconnect behavior through it; normal HTTP success is insufficient.
No HA or zero downtime is promised. Registry ownership, environment reviewers, backup
storage/retention, operational SLOs and optional Cloudflare remain owner decisions. Coolify is selected; vps-ops must verify its prebuilt-image workflow.

## Resolved indexing packaging handoff

The previous `94408ab` image omitted Git and required a test-only indexing wrapper.
The committed conversational pin `6b1e65f2406ba5ddf21d15c56c34ccf672d90bbb` includes a pinned
Git package in the API image. Local verification now uses that exact API image for indexing;
`Dockerfile.indexer` and its duplicate service/build have been retired. The public corpus
remains read-only and the indexing command runs with its checkout owner's UID/GID because
Git intentionally ignores external safe-directory configuration. No sibling checkout or
production volume is used. See [contract provenance](api-contract.md).
