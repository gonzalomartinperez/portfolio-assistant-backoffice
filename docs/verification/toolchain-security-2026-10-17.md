# Toolchain and redacted secret verification — 2026-10-17

Scope: patch maintenance after main `a5abcb4`. One source implementation remains the
private backoffice; visitor chat belongs to the portfolio and stays disabled. No UI feature,
API contract, schema, migration or production trigger changes. Node24.22.0, Next16.4.2 and
Playwright1.64.1 were checked against official releases and npm peer metadata. TypeScript7.0.2
remains the primary checker; its existing compiler-API/generator arrangement is unchanged.

## Executed local checks

WSL/Linux, pinned Node24.22.0:

- Frozen main and isolated contract installs passed; both npm audits reported zero findings.
- **68 unit/contract tests passed**. The actual secret scanner is exercised in isolated Git
  fixtures with synthetic markers: ignored-but-tracked files, deletion from current files,
  an unmerged reachable branch and a shallow clone that must fail closed. No credential
  or real session is generated. Fixture directories are removed by their owning tests.
- Type generation/checking passed with the explicit TypeScript7 checker; format/lint passed
  with the same pre-existing non-error diagnostics outside this change.
- Current/history scan: **168 current text files, 792 reachable blobs**, zero known-pattern
  findings before this evidence document was added. Counts change as files/commits grow.
- Contract generation produced no artifact drift; docs and skill validation passed.
- Production build and migration packaging passed in **113.98s** (1,219 traced migration
  files). All emitted static JavaScript: 27 files, 1,365,302 bytes raw and 419,395 bytes
  gzip. This includes all chunks, not per-route transfer; no matched before/after
  measurement or browser-performance improvement is claimed.
- Both exact new image bases were pulled and probed without network access, as UID65532,
  with read-only root, dropped capabilities and memory/CPU limits. Builder and distroless
  runtime reported **v24.22.0**. This verifies the pinned images' interpreter, not the full
  application or registry publication.

## Boundaries and remaining verification

Full exact-head CI remains mandatory for the production application image, HIGH/CRITICAL
scan, real PostgreSQL IAM/migrations/logical restore/persistent restart, fake OAuth and
Chromium/Firefox/WebKit operations/accessibility scenarios. This local Docker29.1.3 lacks
Buildx; no global plugin or unsupported builder fallback was introduced. Existing CI performs
those builds on its managed runner. Private fixture sessions and raw artifacts stay ignored.

Shared browser installations now preserve other versions with `PLAYWRIGHT_SKIP_BROWSER_GC=1`;
contributors may instead isolate `PLAYWRIGHT_BROWSERS_PATH`. Do not clean shared caches or
classify a missing browser as a skipped acceptance test. See [CI](../ci.md).

The scanner uses high-confidence patterns and all locally reachable refs. It does not prove
absence of every secret, PII, unrecognised encoding or unreachable object. It never prints
matched bytes. History is fetched fully by static CI, and incomplete local history fails
closed. No history rewriting, credential rotation or new secret manager is implemented.

Production OAuth, physical devices/assistive technology, real VPS resource peaks, effective
proxy/TLS and off-server recovery remain unverified here. No unmeasured bundle/render/latency
improvement is attributed to the patches. Registry publication, deployment and analytics
collection remain disabled.
