# Backoffice runtime contract for vps-ops / Coolify

This application supplies a tested image and runtime contract. Private **vps-ops** owns
Coolify, production composition, proxy/TLS, networks, secret provisioning, monitoring,
release selection, backups and deployment. Production deployment and image publication
are not authorized by a source merge. The portfolio remains on Hostinger Business.

## Artifact and startup

Build `docker build --platform linux/amd64 -t portfolio-assistant-backoffice:rc .`.
The Dockerfile pins Node 24.21.0 by digest and uses `npm ci`, Next standalone output,
`.next/static`, public assets and a non-root runtime (UID/GID 1000). Linux amd64 is the
verification target; arm64 is unverified. Build needs dependency and build-time font
network access. Authentication and operational secrets are runtime-only, never build args.

Intended image name: `ghcr.io/gonzalomartinperez/portfolio-assistant-backoffice`.
Visibility/access require separate approval; public source does not determine package
visibility. vps-ops must select a verified immutable digest, not rebuild source on the VPS.
Its agent verifies the exact supported Coolify prebuilt-image workflow.

Startup: exec-form `node server.js`, `/app`, `0.0.0.0:3000`. Keep port 3000 private.
Migrations are explicit, not run automatically at startup. Required configuration is
validated before authentication initialization. Missing configuration or database access
makes readiness fail; no secrets or SQL errors are returned to the browser.

- `GET /api/health`: process liveness only; no database, OAuth or operational guarantees.
- `GET /api/ready`: configuration and authentication schema/database readiness; 200 or 503
  with a minimal status. It does not certify OAuth providers or the private operational API.
- Docker health checks liveness every 30s, timeout 5s, start period 20s, retries 3. Coolify
  should use readiness for traffic admission and retain a separate liveness policy.
- SIGTERM reaches Node directly. Use a measured termination grace period, starting with
  20s for local verification; active requests may be interrupted. No zero-downtime guarantee.

## Runtime configuration

| Variable | Type / requirement | Handling |
| --- | --- | --- |
| `BACKOFFICE_ORIGIN` | Required exact HTTPS origin; HTTP only for loopback fixtures | OAuth callbacks and trusted origin. No paths, credentials, queries or wildcard origins. |
| `BACKOFFICE_DATABASE_URL` | Required PostgreSQL connection URI | Secret; dedicated IAM database/user, bounded pool, separate from API data. |
| `BETTER_AUTH_SECRET` | Required secret, at least 32 characters | Session/OAuth protection; rotation can invalidate sessions and requires reviewed recovery. |
| `BACKOFFICE_OWNER_EMAIL` | Required verified email | Owner admission; not an unrestricted first-user bootstrap. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Required provider configuration | Secret value stays server-side; register the exact callback origin. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Required provider configuration | Secret value stays server-side; no email/password fallback. |
| `OPERATIONS_API_ORIGIN` | Optional exact private HTTP(S) origin | Server-only endpoint location; absent means unconfigured. Never a browser/public variable. |
| `OPERATIONS_READ_TOKEN` | Optional secret paired with operational origin | Read-only private service credential; never forwarded to browser. |
| `OPERATIONS_SOURCE_MODE` | Omit in production | `fixture` labels synthetic local evidence; production must never substitute fixtures. |
| `PORT`, `HOSTNAME` | Image defaults 3000 and 0.0.0.0 | Retain defaults; health check targets 3000. |
| `NODE_ENV`, `NEXT_TELEMETRY_DISABLED` | Image sets production and 1 | Next/Better Auth product telemetry disabled. |

Configuration is read server-side at runtime; changes require a process restart, not an
image rebuild. No `NEXT_PUBLIC_*` configuration is needed for the backoffice. `.env.example`
is a schema of safe placeholders. Environment injection is supported; file-based secrets
must be injected as environment values by the platform, not custom application tooling.
Do not bake environment files into images or print values in logs/artifacts.

Host-scoped HttpOnly session cookies, Secure on HTTPS and SameSite=Lax, use no parent-domain
cookie sharing. Exact trusted-origin and provider state checks remain required. Explicit
account linking is available; implicit linking and open registration are disabled.
See [authentication](authentication.md) for admission, invitations and revocation.

## Migration, storage and compatibility

Run the tested image with `node scripts/auth-migrate.ts` before admitting traffic.
It applies the official Better Auth migrations and repository IAM SQL. Use a dedicated
PostgreSQL connection, backup first and serialize migration execution in vps-ops. The
current migration is initial schema creation; multi-version migration/rollback compatibility
has not been validated. Image rollback does not reverse database migrations. Do not run
fixture-session or integration reset tools against production.

No persistent container data is required. PostgreSQL stores IAM records, sessions,
encrypted OAuth credentials and audit records; vps-ops owns encrypted off-server backup,
retention and restoration testing. Read-only root uses ephemeral `/tmp` and, when required
by Next assets, `/app/.next/cache` owned by UID1000. Drop capabilities and enable
no-new-privileges; resource limits, restart/log policies belong to vps-ops.

The backoffice owns `/api/auth/*`, `/api/operations`, `/api/health` and `/api/ready`.
**Do not route all `/api/*` to FastAPI on the backoffice origin.** At the proposed `https://assistant.gonzalomartinperez.com` origin, route only
`/api/v1/*` to FastAPI, preserving its prefix; all other application paths belong to
Next. Never publish `/internal/ops/*`. Portfolio requests remain cross-origin and need
the API's exact credentialed CORS/CSRF policy. vps-ops verifies this route selection. No iframe is required. Backoffice responses deny
framing and exclude shared caches. Effective Coolify/proxy headers must preserve these
policies without exposing private operational routes.

The inspected API revision is `c6012067c4a99db477bb6ddcf1f26dae095641ca`.
No operational contract has been consumed yet: `/internal/ops/v1/status` is a
[proposed backend handoff](backend-operations-request.md), not a production guarantee.
The adapter uses no-store, a five-second timeout, no redirects, bounded UTF-8 JSON and
strict field validation. Browser responses never include raw backend errors.

## Network, logging and acceptance

Required outbound access: private IAM PostgreSQL, Google/GitHub OAuth endpoints and the
future private operations API. No model-provider key or direct model call belongs here.
OpenTelemetry collectors/storage and shared monitoring are vps-ops/API responsibilities.
Operational payloads must exclude prompts, answers, credentials and arbitrary attributes.
Next/pg errors use generic safe messages; no request-body/session logging is added.
Proxy logs must redact invitation tokens and OAuth callback query strings, and never
capture cookies, authorization headers or provider callback bodies.

Smoke the exact digest: apply migrations to an isolated test database; verify health and
readiness, anonymous redirects and 401s; establish a signed fixture session; check owner
and viewer permissions, static assets, unavailable operational state and safe refresh.
Then verify real Google/GitHub callbacks over HTTPS, exact origins, session expiry,
revocation, effective cache/framing headers and graceful restart through Coolify.
Fixture sessions are credentials: private ignored files only, never uploaded as artifacts.

No VPS resource guarantee, live OAuth result or successful production deployment is
claimed. Remaining owner/ops decisions: approved origin, OAuth registrations, package
visibility, registry access, compatible digests, secret delivery, measured limits,
backup/restore evidence, migration recovery and proxy validation. Shared production
configuration is not maintained here. Historical chat proxy fixtures were retired after
verified native migration to the portfolio; immutable baseline evidence remains in Git.

## Monitoring integration ownership

Prometheus/Grafana are approved design choices for private technical monitoring;
installation and effective access controls belong to vps-ops. The application neither
embeds Grafana nor connects browsers directly to a metrics datasource. No new monitoring
environment variables or outbound destinations are needed for this image. The API's
committed private summary remains a prerequisite for real dashboard data; the durable
backend accounting ledger, not Prometheus counters, determines estimated spend/budget.
See [monitoring contract request](backend-operations-request.md#prometheus-and-grafana-handoff).
