# Actions design and release preparation

Every workflow was audited: `quality.yml` is the required validation pipeline;
`release.yml` is manual image preparation and `dependency-policy.yml` is a staged
control-only dependency gate. See [dependency maintenance](dependency-updates.md) for its
policy, job permissions, activation prerequisites and pause procedure. There is no push/develop deployment trigger.
All third-party actions are full SHA pins, resolved against their upstream v4/v3/v6 refs
on 2026-09-27; review source/release notes when Dependabot proposes changes. Existing
checkout/setup-node/upload pins were retained. New download-artifact, setup-buildx and
build-push pins are from their official repositories. No untrusted action gets production
credentials. Actions documentation: [required checks](https://docs.github.com/en/pull-requests/how-tos/merge-pull-request/troubleshooting-required-status-checks),
[workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

## Required quality graph

| Job | Purpose |
| --- | --- |
| static | Frozen install, explicit dependency audit, Biome, strict typing, unit/contract/boundaries, redacted scan, local links, generated drift |
| image | One standalone production build, pinned base, export exact image for downstream tests |
| browser | Same image read-only/non-root, deterministic HTTP/SSE, 90 Chromium/Firefox/WebKit standalone/embedded interaction/accessibility cases |
| live-fixture | Same image with pinned real API, PostgreSQL/Neo4j, Nginx; six browser flows plus proxy/session/SSE smoke |
| checks | Always runs after every job; fails unless every result is success; preserves existing required status name |

Static and image work run in parallel. Browser and live integration run independently after
the image. No repeated Next build in browser/live jobs; image publication also reuses the
verified artifact. Each runner still installs its own locked test dependencies. Installs disable duplicate
audit/funding requests; one required `npm audit --audit-level=moderate` step checks all
locked production and development dependencies. A registry/audit failure fails validation. npm cache
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

Explicit Bash defaults enable pipefail, so failed image save/load commands cannot be hidden
by a successful downstream command. Cleanup runs independently of container log collection.
Step names describe purpose; the required job ID remains `checks`.

Default permissions are contents:read, checkout credentials are not persisted. Quality PR jobs use
no repository secrets. The separate dependency control workflow uses privileged events
but executes only trusted default-branch scripts, never PR code or artifacts. Fixture
credentials are intentionally public and isolated. Fork PR images are never published.
Production images contain neither tests/dev dependencies nor environment/secret files.
Artifacts contain synthetic fixtures only: browser reports/traces/screenshots for 14 days,
live failure logs for 14 days, verified image for seven days. Always collect browser evidence;
collect live logs on failure, and tear down only the dedicated test project.

## Manual image publication; no production execution

`release.yml` requires an explicit publication/visibility acknowledgment on a manual develop
invocation, then runs the full quality graph. Its protected `container-release` environment
must be configured with reviewers before use. Only the publication job has packages:write;
untrusted PRs never receive publishing authority. It uploads the tested image's digest and
frontend/API compatibility revisions. The workflow has not been dispatched here.

Production execution belongs exclusively to private vps-ops and the selected Coolify workflow.
The previous hard-disabled placeholder job was retired after the owner confirmed that
replacement authority; it contained no deploy implementation or useful infrastructure.
There is no SSH, deployment webhook, production job or automatic deployment trigger in this
repository. Merging/publishing does not authorize vps-ops to deploy. See the
[runtime contract](deployment-contract.md) for the exact handoff and remaining decisions.

Run timings and actual GitHub results belong in [verification](verification/quality-chat.md).
The previous pipeline's latest successful run took 164s end-to-end (run 36264943719), but
had narrower coverage; it is not a like-for-like speed benchmark. Record new job durations
and critical path, not an unsupported percentage speedup. Tests/security/reproducibility
must remain intact when tuning caches or workers.

## Dependabot review

Version-update configuration covers npm, SHA-pinned Actions and the root Dockerfile's Node
image, targeting develop with bounded monthly PR counts. Node Docker major updates require
a deliberate runtime migration; patch/digest updates remain monitored. API/integration
image pins follow the API-owner contract handoff, not unrelated automated upgrades.
Dependabot PRs use the same complete validation, read-only tokens and no repository secrets;
there is no privileged bot auto-approval or bypass. Merge compatible updates only after
review and successful checks, integrate into develop without bypassing review.

At the 2026-09-27 promotion audit, no Dependabot PR was open and npm audit reported zero
vulnerabilities. GitHub's alerts endpoint returned “alerts are disabled” and a missing
administrative token scope, so no clean GitHub-alert claim is made and token scopes were
not expanded. Version-update configuration does not substitute for enabling security alerts.
The repository owner must enable those separately with appropriate account permissions.

Browser binaries remain uncached following the [Playwright CI guidance](https://playwright.dev/docs/ci#caching-browsers):
Linux OS dependencies still need installation, and restoring binary caches may cost as much
as downloading them. This does not prevent using npm and content-addressed BuildKit caches.

Current dependency review: Node types remain on the runtime-matching 24 major. TypeScript
7 fails the frozen install because the pinned contract generator requires ^5.x; compiler
and Node-type major upgrades are held for a coordinated migration. No peer checks are
bypassed. Next patch and reviewed Docker Action SHA updates receive the full CI graph.

Embedded-first validation runs in the existing browser job, using the same production image
with runtime `EMBED_ALLOWED_ORIGINS=http://localhost:3110`. The managed test-server lifecycle
also owns the cross-origin host on 3110; no second frontend build or privileged workflow is
added. The live-fixture job uses its own host lifecycle against the pinned API/proxy stack
and verifies the combined response framing headers. Loopback origins belong only to tests,
not the production default. Both standalone and embedded cases remain required.
