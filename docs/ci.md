# Application validation and artifact readiness

Production execution belongs to private `vps-ops` and its Coolify workflow. This repository
validates the backoffice and prepares its immutable image; it has no SSH, deployment
webhook, automatic publication or production deployment job.

## Required validation graph

| Job | Purpose |
| --- | --- |
| `static` | Frozen install, dependency audit, Biome, strict types with generated Next routes, unit/authorization/operations checks, contract drift, architecture, public-file scan, documentation and skills |
| `image` | One pinned-base standalone production build; export the exact image used downstream |
| `browser` | Isolated PostgreSQL, image migration, non-root/read-only production runtime, real database-backed authorization and operation fixtures, Chromium/Firefox/WebKit interaction and accessibility checks |
| `checks` | Always evaluate every required job; reject failures, cancellation and unexpected skips |

Static validation and the image build run independently. Browser verification consumes the
image artifact rather than rebuilding source or running a development server. The required
status name remains `checks`; update branch protection only through a reviewed change if
that name ever changes. The former public-chat live fixture is transferred with the chat
to the portfolio; backoffice verification exercises its own database/authentication boundary.
Do not count retired chat tests as backoffice coverage.

All PRs into `develop` or `main`, merge groups, manual runs and reusable release verification
execute the complete graph. No global path filters or conditional diff checks can leave a
required status pending. A new revision cancels obsolete validation for the same workflow/ref;
independent PRs remain independent. The release group serializes publications without
cancelling an in-progress release. Timeouts bound every job.

## Reproducibility and permissions

`npm ci` is mandatory. Setup-node caches downloads with an explicit lockfile path and its
OS/architecture/lockfile-aware cache key; a cache never substitutes for installation. Explicit
required audits cover both the root and isolated contract-generator lockfiles, including
production and development dependencies. Frozen installs skip implicit audit/funding work.
BuildKit uses a separate `backoffice-node24-amd64` scope and content-addressed build inputs.
No broad node_modules restore key is used. Browser binaries remain uncached, following
[Playwright's CI guidance](https://playwright.dev/docs/ci#caching-browsers); install their OS
dependencies explicitly. Compressed image artifacts disable redundant recompression.

Third-party actions use reviewed immutable commit SHAs. Upload-artifact 7.0.1 and
download-artifact 8.0.1 replace the reviewed pending maintenance proposals; their upstream
sources are [upload-artifact](https://github.com/actions/upload-artifact/tree/v7.0.1) and
[download-artifact](https://github.com/actions/download-artifact/tree/v8.0.1).
Node 24 actions require a compatible GitHub-hosted runner; no production self-hosted runner
receives PR code. Quality has only `contents: read`; checkout never persists credentials.
PR jobs receive no repository secrets. The dependency policy workflow remains a separate
trusted metadata controller; see [dependency maintenance](dependency-updates.md).

The browser job uses only public synthetic fixture credentials, a private job database and
isolated container. It migrates before startup using `node scripts/auth-migrate.ts`, runs the separate
`node --test tests/integration/auth.test.ts` OAuth/code-exchange suite against that test
database, then verifies
the production image, and removes only its own application container. GitHub cleans up its
service container. No paid model/provider call is part of this pipeline. OAuth fixtures and
seeded database sessions do not establish Google/GitHub production-provider compatibility.

Browser reports, synthetic traces and screenshots are retained for 14 days. Container logs
are retained on failure; never introduce real credentials or conversation content into these
fixtures. Verified images last seven days. Cleanup runs even after a test failure. Read-only
root filesystem, non-root user, dropped capabilities and bounded tmpfs match the runtime
contract; configuration is supplied only at runtime.

## Manual publication, not deployment

`release.yml` is dispatch-only. It accepts `develop` and an explicit publication/visibility
acknowledgment, executes the full required quality graph, and reuses that exact image.
Configure reviewers on the `container-release` environment before use. Only the publish job
has `packages: write`; it uses `GITHUB_TOKEN`, without a PAT or production secret. Package
visibility must be separately approved before the first publication. Fork artifacts are never
published. No publication is authorized by merely merging these files.

The resulting `release.json` records the backoffice SHA, pinned API SHA, contract hash and
published image digest, with deployment explicitly disabled. Its validator rejects mutable
tags and malformed provenance. It does not claim portfolio compatibility without the
portfolio owner's separate release evidence. `vps-ops` selects the compatible application
artifacts and performs any subsequently authorized deployment; source is not rebuilt on the VPS.

## Evidence and optimization

Record actual Actions URLs, per-job/step duration, critical path, queue time and cache hits in
release evidence. Compare at least five comparable runs before claiming a measured speedup.
A local YAML check is not an executed workflow, and a fixture session is not a real OAuth
login. The migration pipeline cannot reuse earlier public-chat run times as backoffice results.
Preserve coverage, security and reproducibility when tuning workers or adding shards.

GitHub reference: [required checks](https://docs.github.com/en/pull-requests/how-tos/merge-pull-request/troubleshooting-required-status-checks)
and [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

## Backoffice fixture lifecycle

`node scripts/test-server.ts` owns the loopback proxy on 3107, standalone runtime on 3108
and synthetic operational source on 8117. Supply an isolated, migrated PostgreSQL URL
through `BACKOFFICE_DATABASE_URL`; it must use a loopback host and a test/fixture database.
The local default uses port 15432. A local production build is required; static/public assets
are copied into the standalone build before startup. `WEB_UPSTREAM` reuses the verified
container and must also be loopback. CI exposes the fixture source to that job's container
through its host gateway; it contains synthetic data only and requires its fixture token.

Signed owner/viewer sessions are created through Better Auth's internal adapter, written
with restrictive permissions under gitignored `.artifacts`, and removed on shutdown. There
is no application authentication bypass endpoint. Fixture secrets and session files are
never uploaded. Browser traces may contain synthetic test-session cookies; they have no
access outside the isolated test database and must never use production credentials.

Operational modes are immutable per server lifecycle: `available`, `unavailable`, or
`malformed`, selected by `OPERATIONS_FIXTURE_MODE`. The CI browser job first runs
`backoffice.spec.ts --grep-invert "operational failure"`, then starts a fresh fixture lifecycle
in unavailable mode for `--grep "operational failure"`. Both reuse the same application
image; no global mutation races between browser engines. Their result and HTML directories
are separate so failure evidence cannot overwrite the successful suite's report. Malformed
payload validation is also covered at the adapter boundary.

## Headless browser download optimization

CI installs Chromium Headless Shell plus Firefox/WebKit with the locked Playwright CLI
(`--no-install`, `--only-shell`). No project selects a headed Chromium channel, so the
unused full Chromium download is omitted without dropping browser/test coverage. OS
dependencies are still installed; browser caches are intentionally not restored.
Reference: [Playwright browser installation](https://playwright.dev/docs/browsers#chromium).
Compare executed installation-step durations before making speedup claims; network and
runner variation mean one run is not a controlled benchmark.
