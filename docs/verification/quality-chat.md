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
