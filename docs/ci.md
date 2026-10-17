# Continuous verification and artifact privacy

Current2026-10-13 graph: static verification runs independently from the browser job.
The browser job builds, scans and runs **one exact image on the same ephemeral runner**;
no image archive is uploaded to public repository Actions storage. `checks` requires both
jobs and rejects failed, skipped, cancelled, pending or missing results. No path filter can
skip verification. Repository rules remain authoritative; no admin bypass or bot approval.

| Job | Evidence |
| --- | --- |
| static | Frozen main/isolated contract installs, audits, format/lint/type checking, unit/contract/architecture, public-file/docs/skills checks and contract drift |
| browser | Pinned Trixie builder/distroless runtime; full HIGH/CRITICAL scanner gate; PostgreSQL18.6; exact-image migrations/readiness/resource/anonymous workload checks; real database IAM plus fake OAuth; Chromium/Firefox/WebKit operations/accessibility; bounded SIGTERM |
| checks | Fail-closed aggregate, required by repository protections |

Build inputs use `.dockerignore` allowlisting and no production secrets. Hosted runners are
GitHub-managed Ubuntu24.04, not the VPS; actions are SHA-pinned and checkouts do not persist
credentials. PR execution has only `contents: read`. Fixtures have explicit synthetic secrets,
loopback origins and dedicated runner data. Image/DB checks do not establish live OAuth,
public TLS, VPS capacity or production API pairing.

Trivy0.75.0 is downloaded with a reviewed SHA256 check and scans OS and Node dependencies
with no suppression file. Any HIGH/CRITICAL blocks the image's browser acceptance. Medium/low
findings still require review. Compiler/tracer executables, npm and shell are absent from the
runtime; migration dependencies are traced separately. See
[container verification](verification/container-readiness.md) for historical measurements.

Browser prerequisites wait for both isolated authentication verification and browser
preparation; either child failure stops acceptance. Available/unavailable operations run
separately against the same image, with their own result directories and labelled fixture
payloads. No engine/case is removed. Exact owned container cleanup runs even on failure.
Local screenshots/reports remain available for authorized inspection; ordinary public CI
uploads no container archive, browser report or raw container log. CI logs contain only fixture
verification, never production environment values, tokens or conversation content.

## Publication remains separately gated

`release.yml` can verify reviewed develop through manual dispatch, but its publish job is
hard-disabled and has no package-write permission. It cannot upload the legacy public image
archive or publish to an unverified GHCR package. Private artifact delivery must be implemented
and independently visibility/access-checked in the coordinated vps-ops release path before
owner-authorized publication. A confirmation checkbox is not an independent approval gate.
No production deployment or credential is configured by this change.

App-owned `scripts/release-compatibility.ts` remains available to prepare provenance from
an actually published immutable digest after approval; local image IDs are not registry
references. Baseline/source/runtime evidence and rollout constraints belong in the
[deployment contract](deployment-contract.md). CI completion is release evidence, never proof
that a server was deployed, secured or restored.

## Local browser lease and redacted history checks

Use `PLAYWRIGHT_SKIP_BROWSER_GC=1 npx --no-install playwright install --with-deps chromium firefox webkit`
when another workspace session may be running a different Playwright version. Alternatively,
set a task-owned `PLAYWRIGHT_BROWSERS_PATH` for both installation and execution. Do not
clean the shared `~/.cache/ms-playwright`. Browser revisions belong to the locked package;
a missing revision is an infrastructure failure, never a reason to skip an engine or weaken
a gate. Preserve the original failed run when repeating affected checks.

`npm run security:check` checks current tracked/unignored files plus blobs reachable from
all local Git refs, including deleted files and unmerged branches. Static CI fetches full
history; a shallow repository fails closed. Detector names and object IDs are emitted,
never matched bytes. Temporary Git fixtures prove ignored-but-tracked, deleted-history and
unmerged-branch detection with synthetic markers. Known-pattern coverage cannot establish
that every secret, personal datum, binary format or unreachable object is absent. Fetch
relevant remote refs before a local audit; do not rewrite history or rotate credentials
without the maintainer's explicit authorization.
