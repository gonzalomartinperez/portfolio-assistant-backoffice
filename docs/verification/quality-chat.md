# Quality chat verification — 2026-09-27

## Baseline and scope

Started from `feat/quality-chat`, based on `8c460f6`, with the user's existing uncommitted
chat/layout/styles/fonts/avatar, validation, transport, localization and test work. That
work was incorporated and extended, not reset/stashed/discarded. No unrelated changes
were included. API and portfolio remained read-only; API-agent processes were not stopped.

Baseline lint, five parser/validation tests and production build passed. Before restructuring,
rendered screenshots were captured in `baseline-desktop.png` and `baseline-mobile.png`.
These are development screenshots of the preserved working tree; the dev indicator is
visible on mobile and is not part of production. Subsequent verification uses production.

## Reproducible checks

See README for exact commands. Node 24.21.0, npm lockfile install, Next 16.3.5 webpack
production build and the same WSL machine are used. The deterministic API binds only to
127.0.0.1:8107; Playwright owns web port 3107 and refuses existing processes.

Unit/contract coverage includes pure lifecycle transitions, one generation per submit,
cancellation during creation/streaming, stale history, unmount abort, session expiry,
delete failure, partial recovery without resending, HTTP credentials/bootstrap/CSRF,
pagination, safe public errors, runtime payload validation and wire mapping. SSE tests
exercise every split point for multilingual bytes/CRLF/multiline data, comments, malformed
UTF-8, oversized buffers, terminal identity/order, early EOF, abort and reader release.
An AST check enforces domain/application/presentation import boundaries and public config.

Browser checks exercise anonymous history, source navigation, feedback, rename/delete,
stop/partial preservation, interruption/rejection/expiry/reconnect, backend unavailable,
IME/Enter/Shift+Enter, long Markdown and unsafe protocols, reading earlier text, jump to
latest, theme/language, blocked storage, keyboard drawer dismissal/focus, CSS zoom,
reduced motion, system theme, navigation during streaming and a reduced keyboard-sized
viewport. Axe checks WCAG 2/2.1 A/AA rules on both themes and actual answered conversation.

Viewport matrix: 320×740, 430×932, 768×1024, 844×390 landscape and 1440×900; focused
composer additionally checked at 320×360. Chromium, Firefox and WebKit run the same suite.
Screenshots are inspected directly, not inferred from passing assertions. Browser reports,
traces and full matrix screenshots are available under `test-results/`, `playwright-report/`
and the CI `browser-verification` artifact. Representative screenshots are committed here.

The first WebKit run exposed overflow at CSS 200% zoom; wrapping preference controls fixed
it. A separate native WebKit page crash reproduced during interruption/rejection with CSS
brightness filters, and disappeared when only those filters were disabled. The controls
now use border/background/shadow feedback without brightness filters. No browser/test was
excluded to address either finding.

## Bundle and render behavior

`baseline-bundle.json` and `final-bundle.json` sum every production JS chunk, including
framework/not-found chunks, and gzip each independently. This is an artifact-size measure,
not an assertion about initial route transfer or field Core Web Vitals. The only added
dependency is dev-only axe; no runtime library was added. The baseline and final measurements
use the same script/machine/build mode (baseline collection used equivalent inline code).

Streaming remains plain text; completed Markdown is memoized with stable feedback props.
The baseline message component rerendered with its parent on every delta. No numeric React
commit-duration baseline was captured, so no render-time improvement percentage is claimed.
The long-output browser scenario verifies continued scrolling and no scroll hijack.

## Live integration and limits

The CI `live-fixture` job retains real credentialed HTTP/SSE/history checks against API
`94408ab4b59297e93e2574320b3049ee2f5d4f2e` and corpus revision
`1acbe54906c88398652aebb8eae0c217fd0d8821`, with PostgreSQL/Neo4j and fixture providers.
The design reference is separately `45d8a42faa78bfb94952639ed462832c3b4ad109`.
Local deterministic tests do not demonstrate live backend behavior; live CI results must
be read separately. No paid model, production deployment or field performance was tested.

Desktop browser emulation, a reduced viewport and CSS zoom do not prove actual iOS/Android
keyboard/browser-chrome behavior, native page zoom, or assistive-technology announcements.
No physical device or human screen-reader audit was available. Keyboard/focus and rendered
screenshots were reviewed through browser automation. The committed API handoff now supplies discriminated event schemas/examples, imported and
tested at the transport boundary; portfolio integration instructions are in `docs/api-contract.md`.

## Bounded review outcomes

Read-only architecture/security and accessibility reviewers reproduced two lifecycle races
and a focus-restoration defect. Regression tests now protect an active stream from late
feedback failures, correlate recovered answers to the current partial (including remote
cancellation with stale history), and assert rename/delete/cancel focus restoration.
The import checker was strengthened to resolve paths and inspect dynamic/type-only imports,
with negative fixtures for traversal bypasses. Reviewers did not edit any repository files.

The code license is MIT with explicit identity/third-party scope. CONTRIBUTING documents
the Google TypeScript guide adaptations; Biome/strict TypeScript/CI enforce applicable
rules without overriding React, Next or accessible native semantics. Security reporting
uses the owner's verified public portfolio address; no reporting SLA is promised. Local
link validation and a redacted high-confidence file scan supplement human review.

## Container, clean checkout and shared-proxy evidence

The frozen clean checkout at `c374aeb` installed 167 packages (zero npm audit findings),
passed strict typing and all **27 unit/contract/boundary tests**. Generated HTTP types
remain unchanged after importing API `94408ab`'s committed handoff. Formatting, lint,
local documentation links and the redacted high-confidence scan passed.

The standalone production image built locally as
`sha256:8e243a07710542b91d38a81d7c6f199b9cb6c92189ec69167787db73958015f9`
(96,542,449 bytes, about 92.1 MiB). This is a local image ID, not a published registry
digest. It runs as UID 1000 with read-only root, no capabilities/new privileges, writable
/tmp and a bounded UID-owned 32 MiB image cache. Review detected optimizer write failures
when only /tmp was writable; the corrected mount preserves image optimization and clean
runtime logs. No server/provider secret enters the image or browser configuration.

Local full-stack fixture verification uses the pinned API, PostgreSQL/pgvector, Neo4j,
Nginx and frontend containers on dedicated networks. **4/4 live browser tests passed**
(13.0s). Proxy smoke passed preserved paths/no double prefix, host cookie, exact portfolio
CORS, rejected origins/CSRF, 16 KiB request cap, no-store, 23 SSE deltas, disconnect/cancel
and deletion. One cold fixture stream measured 208ms to first delta / 321ms total; a warm
run measured 73ms / 178ms. A separate two-second delayed upstream proved event arrival
before completion and Nginx SIGQUIT drained the active stream. These are local fixture
observations, not paid-provider, TLS/CDN or VPS capacity results.

After these flows, one idle Docker stats sample measured web 58.5 MiB, API 128.4 MiB,
PostgreSQL 46.6 MiB, Neo4j 654.4 MiB and proxy 5.5 MiB (about 893 MiB total). Excludes OS,
other projects, build/indexing peaks and test probe; it does not size the future VPS.
The proposed frontend ceiling is 512 MiB / 1 vCPU, with shared capacity reservations and
load/scaling gates in the deployment handoff. API indexing needs a Git-capable operations
image; the isolated test indexer workaround and request are documented there.

Final all-chunk bundle: 1,119,130 raw bytes / 343,867 independently gzipped bytes versus
1,107,111 / 340,054 baseline (about +1.1%). Same tool and WSL machine, production webpack;
the final sample comes from the standalone image. This is not initial transfer or CWV.

An initial container browser run passed 46/48 while concurrent builds/indexing were
active; Firefox's long flow and WebKit's desktop accessibility matrix hit the unchanged
30s limit. Tests were not removed and limits were not increased. The final corrected
container run uses two workers with builds/indexing complete; its result is recorded below.

## Actual Actions run

[Quality run 36319691105](https://github.com/gonzalomartinperez/portfolio-assistant-web/actions/runs/36319691105)
passed at `c374aeb`: all 48 cross-browser cases, four live-fixture cases and proxy smoke,
plus static validation and the production image. Total elapsed 289s including scheduling;
job durations: static 22s, image 142s, browser 133s, live-fixture 129s, required checks 4s.
Browser/live jobs overlapped after image export; one Next build served both. CI fixture
first-delta/total were 36/62ms, separately from local measurements. No inference about
production latency follows. The previous 164s run covered less and is not comparable.
A final PR-head run is required after verification/documentation and graceful-proxy updates.

Actionlint 1.7.12 passed with only its constant-false-condition diagnostic explicitly
excluded for the intentionally disabled production job; no workflow behavior was changed
to satisfy that diagnostic. The real GitHub run validates execution, not just syntax.

The final local corrected-container run passed **48/48 cases in 2.7 minutes**, two workers,
all three engines, with no retries or relaxed assertions/timeouts. Representative screenshots
were refreshed from that run and inspected in English/light/desktop and Spanish/dark/narrow
mobile. Container logs remained clean during image requests. Graceful-proxy smoke also
passed after the final script change. The bounded acceptance criteria are met locally;
production/device/operator gates in the deployment handoff remain open.
