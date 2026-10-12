# Master prompt — portfolio assistant and backoffice operations

Copy the instructions below to the agent owning private **vps-ops**. They authorize
preparation and isolated verification within that repository, not publication or
production execution. The committed [runtime contract](deployment-contract.md) and
[container evidence](verification/container-readiness.md) are application-owned sources.

## Mission and boundaries

Continue the current vps-ops implementation without restarting or discarding work.
Read its AGENTS/CLAUDE instructions, status, open PRs, inventory and runbooks first.
Own only vps-ops. Read the application repositories and portfolio as references; send
precise application requests instead of editing them. Preserve other writers' changes.

Prepare a measured, maintainable Coolify deployment for the portfolio assistant API
and authenticated backoffice on the future Hostinger KVM 4, alongside other projects.
The portfolio stays on Hostinger Business and its assistant remains **disabled**.
Do not enable it, provision a server, alter DNS, install Coolify remotely, publish images,
use production secrets, call paid models or deploy without separate owner authorization.
No automatic deployment on application merges. Do not add another proxy/controller.

Use one prioritized acceptance checklist: runtime/route compatibility first, security
and recovery second, resource/disk/monitoring efficiency third. Finish working increments
and meaningful tests; no speculative services or repeated architectural refactoring.

## Inspect current committed inputs

At this handoff the inspected revisions are:

- Backoffice baseline develop: `f29b6cd91b6869c7ad190067ef9ca53fdfc06312`; consume
  the later merged container optimization and its successful Actions evidence.
  Canonical public repo is `gonzalomartinperez/portfolio-assistant-backoffice`.
- API: `c6012067c4a99db477bb6ddcf1f26dae095641ca`. Inspect its committed Dockerfile,
  deployment contract, environment schema, migrations, SSE and knowledge-sync behavior.
- vps-ops inspected baseline: `04be6193710d23cab324d7b3bb4da9cf12b2be16`.
  Its portfolio inventory still names the former web repo and iframe routes; reconcile
  actual committed changes before replacing these obsolete assumptions.

Pin the inspected portfolio reference separately. Never depend on application working
trees. Record compatible source SHAs, API/schema contracts, migrations, corpus revision,
image digests and operational-contract availability in a reviewed release manifest.
Local image IDs in application evidence are not publishable registry provenance.

## Coolify, immutable artifacts and routing

Verify the selected Coolify version's official support for prebuilt digest-pinned
images, HTTP readiness, custom exec commands, resource limits, tmpfs, hardening,
networks, bounded logs, secrets and shutdown grace. Document gaps instead of silently
weakening the contract. Source builds on the VPS are not the normal release method.
No deploy webhook or automatic trigger is authorized. Select already tested immutable
artifacts only after publication and package visibility/access have separate approval.

Proposed origin is `https://assistant.gonzalomartinperez.com`; it is not DNS authority.
On that origin **only `/api/v1/*` goes to FastAPI, preserving the complete path**.
Next owns `/`, `/api/auth/*`, `/api/operations`, `/api/health`, `/api/ready` and its assets.
Do not use the old blanket `/api/*` backend route or introduce `/api/api`. There is
no current public `/embed` product. Any API docs/health routing must be separately
reviewed and restricted where appropriate. Never publish `/internal/ops/*`.

The native portfolio chat, when later enabled, is cross-origin. Parent-domain sharing
does not remove credentialed CORS, host-only cookie or CSRF requirements. Consume the
API's exact committed origin allowlist and session contract; never use wildcard
credentialed CORS or leak service tokens to the browser. The backoffice denies framing.
Verify combined application/proxy TLS, cache and security headers on all relevant routes.
Only Coolify's shared reverse proxy exposes application traffic; restrict administrative
access separately. Databases, internal monitoring and operational APIs stay private.

**Committed documentation conflict to resolve with the API owner:** the inspected API
deployment document still describes `/embed` and an assistant-only origin allowlist.
Those presentation assumptions are obsolete. The native portfolio requires its reviewed
exact origin in the API configuration; do not copy the old target allowlist unchanged.
Request an updated committed handoff. Backoffice's retained public contract snapshot is
historical (`6b1e65f2406ba5ddf21d15c56c34ccf672d90bbb`), not proof of a consumed private
operations contract. Release metadata must retain that distinction.

## Backoffice runtime to preserve

Read `docs/deployment-contract.md` for the complete validated environment schema.
Node24.21.0, Next standalone, digest-pinned distroless Debian13, UID/GID65532, `/app`,
private port3000, exec `node server.js`, empty entrypoint, no shell/npm. Health commands
must be HTTP or exec-form Node. Never install dependencies in the runtime.
Use the image's Docker healthcheck or Compose exec-form Node check. Coolify dashboard
HTTP checks require curl/wget, which this image intentionally lacks; do not enable them.
Verify effective image health inheritance and proxy routing in the selected version,
not a shell-based dashboard command. References: [health checks](https://coolify.io/docs/applications/configuration/health-checks)
and [prebuilt images](https://coolify.io/docs/applications/deployments/docker-image).

`/api/health` is liveness. `/api/ready` checks authentication configuration/schema/database,
not real OAuth providers or private operational data. The image probe checks readiness;
monitor process liveness separately without restart loops on database failure. Missing
ops data stays unavailable.
Before traffic, serialize `node scripts/auth-migrate.ts` from the exact tested image.
Back up IAM first; do not assume image rollback reverses schema changes. The initial
schema's multi-version rollback compatibility remains unverified.
Do not blindly use Coolify's generic pre-deployment command: it can execute in the old
container. Verify an exact selected-digest one-off migration instead; see the
[deployment command semantics](https://coolify.io/docs/applications/builds/dockerfile).

Runtime configuration is server-only and restartable without rebuild: exact origin,
dedicated PostgreSQL URI, Better Auth secret, owner email, Google/GitHub OAuth settings,
optional private operations origin/read token. No NEXT_PUBLIC secret or model key.
Register exact OAuth callbacks; owner/invited-viewer admission has no password/open signup.
Use platform secret injection with restricted access; never commit values, print them,
or include them in image args, logs, screenshots or CI artifacts.

Read-only root; `/tmp` and `/app/.next/cache` are ephemeral tmpfs, UID/GID65532 mode0700,
32 MiB each. No persistent application volume. Tested starting profile: 512 MiB memory,
no additional swap, 0.75 CPU, 128 PIDs, drop all capabilities, no-new-privileges, stop20s,
local log driver10 MB x3. Tmpfs counts toward RAM. Preserve equivalent bounded policies
supported by Coolify. Idle SIGTERM was tested; active-request draining is not proven.

Local image disk footprint fell955→302 MB; content bytes198,528,077→72,706,013. Docker29
containerd disk accounting includes compressed/unpacked shared layers. A small synthetic
workload sampled53→72 MiB memory, not peak or a VPS capacity guarantee. CI rejects all
HIGH/CRITICAL runtime CVEs, including unfixed ones; 23 MEDIUM/eight LOW remained on the
local scan date. Re-scan selected digests and triage findings before release.

## API, migrations and streaming

Do not invent backend behavior. Current image runs non-root Python on private8000;
readiness depends on PostgreSQL/pgvector, Neo4j, current schema and public corpus. Verify
the committed compatibility contract, Python/runtime versions and actual target image.
At the inspected revision, API liveness is `/health/live`, readiness `/health/ready`;
the latter checks schema/checksums, active corpus with matching embedding model and graph.
The migration entry point is `python -m app.migrate`; ordered checksum-checked SQL and
LangGraph setup have distinct transaction boundaries. Unknown migrations can reject
older images. Require backups, reviewed forward recovery and explicit rollback limits.

Knowledge sync follows an approved immutable public portfolio revision. Git CLI is a
real runtime dependency, not removable by assumption. Schedule sync and retention as
owned operations jobs with least privilege, concurrency locks, bounded time/resource
limits, idempotence and redacted results. Never ingest private career-ops material.
The assistant must remain disabled while preparations and fixture tests run.

The optional continuous worker uses the same immutable API image and command
`python -m app.knowledge_watch`, one replica with its advisory lock, no HTTP port.
Disable the inherited API HTTP healthcheck for that worker and verify the Coolify
override. Monitor process state and persisted successful checked_at separately from
active-corpus freshness. It needs a writable temporary Git cache, GitHub HTTPS and
separate corpus/ledger write credentials; measure cache/RAM rather than assuming the
backoffice's 32 MiB tmpfs fits it. Source polling defaults60s/freshness expiry90s;
production OpenAI requires the documented fresh-knowledge policy. Worker SIGTERM grace
is at least60s, distinct from HTTP API25s. Do not create a competing recurring sync
that overlaps the continuous worker; choose its operational mode deliberately.

Keep `AI_PROVIDER=fixture`, `EMBEDDINGS_PROVIDER=fixture`, `ALLOW_PAID_AI=false` until
paid use is separately approved. Production secrets include API database credentials,
Neo4j password and RATE_HASH_KEY; OPENAI_API_KEY only when authorized. Current provider
policy is OpenAI only, GPT-6 Luna, medium effort, no fallback or automatically repeated
billed generation, shared approved USD10/month generation/embedding ledger. Do not treat
OpenAI availability as a health probe that spends money. Respect store=False and the
account's applicable retention policy. No external telemetry exporter is implemented.

Verify SSE through the exact proxy path: no response buffering/shared caching, prompt
flushing, bounded request sizes, heartbeat/read-idle timeouts, client disconnect and
cancellation propagation, forwarded-header trust restricted to the proxy, graceful
shutdown with active streams. Configure stop grace consistent with API's current15s
application shutdown timeout plus overhead; test the actual value. Normal HTTP success
does not prove streaming works. If Cloudflare is later selected, test that extra layer
separately. No zero-downtime/high-availability claim on one VPS.

Send the API owner a bounded image optimization request: evaluate builder/runtime
separation; measure unique inode/layer contribution of Git; evaluate Lingua's language
assets for the supported English/Spanish detector without breaking classification.
The inspected local API image occupied997 MB. Apparent Git file sizes double-count
hardlinks, so do not promise savings from them. Preserve knowledge-sync Git, migrations,
contracts, native libs, graceful clients and full SSE tests; return a committed image
contract. Do not perform these source changes inside vps-ops.

## Shared capacity, storage, monitoring and recovery

Inspect actual KVM4 specifications and other workloads before allocating capacity.
Reserve measured headroom for OS, Coolify/proxy, backup/restore jobs and other projects.
Specify per-service CPU/RAM/PID bounds and storage budgets after fixture/load evidence;
do not treat defaults as guarantees. PostgreSQL/pgvector and Neo4j must have private
networks and persistent volumes, never public host ports. Separate application databases
and least-privileged users. Shared PostgreSQL is an option only after compatibility,
restore isolation and noisy-neighbor risks are tested; do not consolidate blindly.
Do not add Redis or another database without an actual application requirement.

Start with useful host/container checks: health/readiness, restart loops, OOM, CPU
throttling, memory growth, disk/inodes, DB/graph growth, backup age/restore proof and
certificate expiry. Prometheus/Grafana may supply private technical aggregates if they
add actionable information. Keep services minimal, access authenticated, cardinality
bounded and retention bounded by time AND storage. No public metrics endpoint, raw
prompts/answers/cookies or arbitrary trace attributes. No telemetry stack just to fill
a dashboard; document its measured overhead before activation.

The backoffice private operational API remains proposed at the inspected API revision.
Read its committed `docs/backend-operations-request.md`; request an additive authenticated
private contract from the API owner. Do not pretend `/internal/ops/v1/status`, OTLP or
backend metrics already exist. Technical counters are not the durable accounting ledger
for monetary usage/budgets. Missing data must stay unavailable, never fabricated zeros.

Bound each log driver and every collector/cache. Redact OAuth callback and invitation
query tokens, credentials and bodies. Account for image compressed/unpacked/unique layers,
BuildKit cache, rotated logs, database WAL, graph transaction logs, monitoring storage,
backups and restore staging. Retain running plus known-good compatible image digests;
implement only narrowly scoped, reviewed cleanup. Never run blanket docker/volume prune
or remove another project's resources. Ephemeral app tmpfs is not persistent storage.

Document encrypted off-server backups, access separation, retention, checksum validation
and tested restoration for IAM, API PostgreSQL/pgvector and Neo4j. Measure recovery time
and data loss windows. A local backup or successful upload is not restore evidence.
Application rollback and migration/data recovery are separate procedures.

## Acceptance and delivery

Use isolated ports, project names, networks and disposable volumes; never stop an
application owner's lab or shared services. Run vps-ops' maintained checks and an
isolated combined-stack fixture: startup order, migrations, private DB connectivity,
readiness, deny anonymous backoffice access, native API session/CSRF, incremental SSE,
cancel/disconnect, private ops denial, redaction, log rotation, resource limits,
shutdown, simulated failure, upgrade and compatible rollback/restore.

Tests must exercise effective proxy paths, not only YAML strings. Distinguish fixture
generation/local OAuth from paid OpenAI/real Google-GitHub/live TLS/actual VPS results.
Do not claim unexecuted checks pass. Missing immutable artifacts or backend contracts
are explicit blockers; continue independent preparation while coordinating owners.

Commit through a focused vps-ops PR under its repository rules. Deliver inventory and
runtime compatibility corrections, one production composition authority, resource/disk
measurements, minimal monitoring/retention decisions, tested recovery runbooks, exact
revisions/digests/test commands and separate owner-approval/VPS-only gates. Keep automatic
production deployment disabled. Do not merge main or deploy merely because CI passes.
