---
name: web-verify-backoffice
description: "Verify backoffice authorization, operational states, keyboard behavior, responsive layouts and EN/ES themes with real PostgreSQL and synthetic operations. Not public conversation QA or deployment."
---

Read the [operating contract](../../../AGENTS.md). Establish the affected flow and whether
fixes are authorized. Review-only requests remain read-only. Follow [README](../../../README.md)
commands with pinned Node, frozen dependencies, a production build, Playwright engines
and an isolated PostgreSQL database whose name includes test or fixture. Never point
fixture or migration tools at shared data or stop unrelated services to free a port.

Before installing browsers locally, preserve other active sessions with
`PLAYWRIGHT_SKIP_BROWSER_GC=1 npx --no-install playwright install --with-deps chromium firefox webkit`
or a task-owned `PLAYWRIGHT_BROWSERS_PATH` used for both installation and execution.
Never clean the shared browser cache. A cache collision is an infrastructure failure;
retain the failed result and repeat the affected checks after the browsers are restored.

Run `npm run test:auth` for real OAuth exchange/session/invitation behavior with the
local fake provider; this is not verification of live Google/GitHub applications.
Run `npm run test:browser` for real membership guards and synthetic operations through
the managed lifecycle. Inspect screenshots, keyboard reading order, focus, touch targets,
long identifiers, narrow/landscape layouts, zoom and reduced motion in both locales/themes.
Check viewer cannot manage access, unauthenticated requests cannot read operations, sign-out
invalidates access, refresh never generates and errors expose no raw service data.

Session fixture artifacts are credentials: keep them private and ignored, never upload
or publish them. Only synthetic, non-sensitive UI screenshots may become public evidence.
Historical chat screenshots are not evidence for this backoffice. Distinguish unit,
PostgreSQL integration, synthetic browser and actual production results.

Missing dependencies or services are an explicit unexecuted check, not success. Return
exact commands, browsers/viewports, reproducible findings and artifact paths. Physical-device,
assistive-technology and real OAuth/TLS behavior remain unverified unless actually tested.

For the operations workbench verify outcome/ID filter combinations, no-match recovery,
nullable p50/p95, zero/overspent budgets, native chart tables and preference Escape focus.
Await ResponsiveContainer resize observation before asserting settled overflow; do not
relax clipping assertions or add arbitrary delays. Use all three engines and 200% text.
Follow [workbench evidence](../../../docs/verification/operations-workbench.md).
