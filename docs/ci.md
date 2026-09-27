# Actions design and release preparation

Every workflow was audited: `quality.yml` is the required validation pipeline;
`release.yml` is new manual preparation. There is no push/develop deployment trigger.
All third-party actions are full SHA pins, resolved against their upstream v4/v3/v6 refs
on 2026-09-27; review source/release notes when Dependabot proposes changes. Existing
checkout/setup-node/upload pins were retained. New download-artifact, setup-buildx and
build-push pins are from their official repositories. No untrusted action gets production
credentials. Actions documentation: [required checks](https://docs.github.com/en/pull-requests/how-tos/merge-pull-request/troubleshooting-required-status-checks),
[workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

## Required quality graph

| Job | Purpose |
| --- | --- |
| static | Frozen install, Biome, strict typing, unit/contract/boundaries, redacted scan, local links, generated drift |
| image | One standalone production build, pinned base, export exact image for downstream tests |
| browser | Same image read-only/non-root, deterministic HTTP/SSE, 48 Chromium/Firefox/WebKit interaction/accessibility cases |
| live-fixture | Same image with pinned real API, PostgreSQL/Neo4j, Nginx; four browser flows plus proxy/session/SSE smoke |
| checks | Always runs after every job; fails unless every result is success; preserves existing required status name |

Static and image work run in parallel. Browser and live integration run independently after
the image. No repeated Next build in browser/live jobs; image publication also reuses the
verified artifact. Each runner still installs its own locked test dependencies. npm cache
keys include OS/architecture and package-lock hash through setup-node; cache-dependency-path
is explicit. BuildKit's GHA cache uses a dedicated Node24/amd64 scope and content-addressed
Dockerfile/context layers. Only application/build inputs enter the build stage, so documentation
edits do not invalidate compilation; the full validation graph still runs. Caches accelerate builds, never replace npm ci or validation.
No node_modules/build/browser binary cache with loose restore keys. Browser OS dependencies
are installed explicitly. Image tar is already gzip-compressed; artifact recompression is off.

PRs to develop or main, merge-group events, manual runs and reusable release verification run the
whole graph. No path filters or diff-based conditional tests can leave required checks
pending or bypass coverage. Do not use CI-skip commit messages. The always-running aggregator
rejects failed/cancelled/skipped jobs. Obsolete runs for the same workflow/ref are cancelled;
independent PR refs do not cancel each other. Timeouts bound stalled jobs.

Default permissions are contents:read, checkout credentials are not persisted. PR jobs use
no repository secrets, no pull_request_target or privileged workflow_run bridge. Fixture
credentials are intentionally public and isolated. Fork PR images are never published.
Production images contain neither tests/dev dependencies nor environment/secret files.
Artifacts contain synthetic fixtures only: browser reports/traces/screenshots for 14 days,
live failure logs for 14 days, verified image for seven days. Always collect browser evidence;
collect live logs on failure, and tear down only the dedicated test project.

## Manual publishing and disabled deployment

`Prepare immutable release` runs only on manual dispatch against develop, reruns the entire
quality graph, then enters the `container-release` environment and publishes its exact image
to GHCR with a source-SHA tag. Only that job has packages:write; no broad PAT or registry
secret is needed. `release.json` records the registry digest and compatible API commit.
Deploy by digest, never the mutable tag. The workflow has no automatic production consumer.
GitHub discovers workflow_dispatch from the default branch. Owner-authorized promotion
uses a separate develop-to-main PR with the same full validation graph. Merging source
does not dispatch publishing or deployment; publishing still requires a manual invocation
against develop. Production deployment remains hard-disabled.

Production is hard-disabled with `if: false`, has no SSH command or VPS secrets, names the
production environment and serializes deployments without cancellation. Before enabling,
the owner must configure required environment reviewers and branch restrictions, explicitly
approve the combined release, and review an API-owned deployment implementation that checks
compatibility, performs reviewed migrations, deploys exact digests, verifies readiness and
real streaming, and can restore a known-compatible image pair. A named environment alone
is **not** an approval gate unless protection rules are configured. Do not remove the hard
disable merely because environment creation succeeds. Database recovery is separate from
application rollback; follow [operations handoff](deployment.md).

Run timings and actual GitHub results belong in [verification](verification/quality-chat.md).
The previous pipeline's latest successful run took 164s end-to-end (run 36264943719), but
had narrower coverage; it is not a like-for-like speed benchmark. Record new job durations
and critical path, not an unsupported percentage speedup. Tests/security/reproducibility
must remain intact when tuning caches or workers.
