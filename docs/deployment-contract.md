# Frontend runtime contract for vps-ops / Coolify

Production authority is the private **vps-ops** repository. Coolify is selected; its exact
supported prebuilt-image workflow remains for that agent to verify. This public application
repository does not install/manage Coolify, compose production services, provision secrets,
publish without approval, or execute production deployments.

## Artifact and process

- Build: `docker build --platform linux/amd64 -t portfolio-assistant-web:rc .`.
  Linux amd64 is verified in CI; arm64 is not verified. Frozen npm dependencies and the
  digest-pinned Node 24 Debian slim base are in the Dockerfile. Build requires npm/font access.
- Intended artifact: `ghcr.io/gonzalomartinperez/portfolio-assistant-web@sha256:…`.
  Package visibility/access must be approved separately from this public repository.
  No registry credentials or publication are provisioned by this change. vps-ops selects
  compatible immutable digests; do not rebuild source on the VPS.
- Next standalone output, `.next/static` and `public` are copied into the non-root image.
  Startup is exec-form `node server.js`, UID/GID 1000, `/app`, listening on `0.0.0.0:3000`.
  There are no migrations, model clients, persistent frontend data or startup database calls.
- Internal `GET /` returning 2xx checks the frontend shell only, not API availability or a
  working conversation. Docker health: interval 30s, timeout 5s, start period 20s, retries 3.
  Configure the equivalent Coolify readiness check against port 3000. Keep that port private.
- Use at least the tested 20s termination grace baseline; SIGTERM reaches Node directly.
  Chat SSE goes directly to FastAPI, not through this process. Proxy/backend shutdown must
  be coordinated by vps-ops; no zero-downtime or active-generation survival guarantee exists.

## Configuration and storage

| Variable | Phase / type | Contract |
| --- | --- | --- |
| `NEXT_PUBLIC_ASSISTANT_API_URL` | Build-time optional URL string | Empty in the production image; browser uses relative `/api/v1/...`. Local development can point at a reviewed HTTP(S) API origin. Never a secret or internal service URL. Changes require rebuild. |
| `PORT` | Runtime integer string | Image default `3000`; retain it because the built-in health check targets 3000. |
| `HOSTNAME` | Runtime bind address | Image default `0.0.0.0` inside private container networking. |
| `NODE_ENV` | Runtime enum | Image fixes `production`. |
| `NEXT_TELEMETRY_DISABLED` | Build/runtime flag | Image fixes `1`. |

The frontend needs **no secrets** and no private server-side API URL. Do not deliver model,
DB, admin, session or registry secrets to its browser environment/build. Existing URL
validation rejects unsupported configured origins; Next validates its listening configuration.
Keep image defaults rather than treating arbitrary runtime public-variable overrides as routing.

Read-only root is tested with writable `/tmp` and `/app/.next/cache` (32 MiB ephemeral tmpfs,
UID/GID 1000, mode 0700). The latter supports Next Image optimization of the approved local
avatar. No persistent volume is required. Drop capabilities and use no-new-privileges;
restart policy, log rotation and resource ceilings belong to vps-ops.

## Routing and compatibility

Proposed origin: `https://assistant.gonzalomartinperez.com`; portfolio remains on Hostinger
Business. Coolify's shared proxy sends `/` to web:3000 and preserves `/api/*` directly to
FastAPI:8000. Browser calls already include `/api/v1`; **do not strip or duplicate `/api`**.
No Next proxy/BFF is needed. Pinned API contract:
`94408ab4b59297e93e2574320b3049ee2f5d4f2e`, with hashes in `contracts/source.json`.
FastAPI root_path is empty; `/docs`, `/openapi.json` and `/health/ready` remain internal to
the API under this routing. An image upgrade must retain contract compatibility or import
a committed, tested handoff before publication.

Frontend startup needs no external service; browser chat requires the API. Only the API
reaches private databases/providers. No public database ports. Public source links open
external HTTPS destinations; fonts and avatar are served locally at runtime.

The portfolio at committed integration revision `e411c0a775b16fd7de962774d875e47191f96b09`
has a direct API panel and standalone link, not an iframe. Required allowed origins are
exactly the assistant origin and `https://gonzalomartinperez.com`. Preserve credentialed
CORS, bootstrap, Origin validation and CSRF; a shared parent domain does not remove these
obligations. Secure host-only `__Host-assistant_session`, HttpOnly, SameSite=Lax, Path=/ and
no Domain are the pinned production cookie expectations. Verify both HTTPS origins before
release. No portfolio change is made here; framing is not required.

Proxy requirements and reproducible local commands are in [verification](deployment.md).
The fixture Nginx disables buffering/cache, preserves paths and tests SSE flushing, request
limits, disconnect/cancellation and graceful proxy shutdown. Those results do not certify
Coolify's actual proxy, TLS, trusted forwarded peers or any Cloudflare layer. vps-ops must
repeat the acceptance checks through its selected deployment path.

## Operational acceptance and transition inventory

| Assets | Ownership / disposition |
| --- | --- |
| Dockerfile, .dockerignore, lockfile, .env.example, application/contract/browser checks | Retain here |
| tests/integration Compose, Nginx, fixture indexer and scripts | Retain, explicitly local verification only |
| quality.yml and manually gated release.yml | Retain: application validation and authorized image publication only |
| Prior disabled production workflow placeholder | Retired after explicit vps-ops ownership confirmation; no deployment implementation existed |
| Production stack, TLS, budgets, backups, migration scheduling and recovery | vps-ops authority; no canonical production stack existed here to transfer |

Local resource observations remain in [verification evidence](verification/quality-chat.md).
The proposed 512 MiB/1 CPU frontend ceiling is not a VPS measurement or guarantee. vps-ops
must budget other projects, OS, proxy and backups, measure representative load, and set SLOs.
Standard Next process logs go to stdout/stderr; the frontend adds no transcript/request-body
logging. Do not configure proxy logs to capture bodies, cookies or CSRF values. Failure
artifacts must use synthetic fixtures only.

Smoke: run the read-only image command in the verification document, confirm `/` and a
`/_next/static/` asset, load the optimized avatar, then use the isolated integration suite
to establish a session, stream incrementally, open a source, stop and delete. Actual release
acceptance additionally requires HTTPS cookies/CORS/CSRF, both origins, readiness, real
streaming and shutdown through Coolify. Never use a paid provider without separate authority.

Frontend rollback selects the previous compatible digest; it does not migrate or restore
backend data. API migration implementations/transaction limits belong to the API; vps-ops
schedules reviewed migrations, backups and recovery. Do not infer database reversibility
from application rollback. Pending owner/ops decisions: package visibility, registry access,
Coolify digest workflow, production reviewers, TLS/origin verification, measured budgets,
backup/recovery evidence and any Cloudflare configuration. No production test is claimed.
