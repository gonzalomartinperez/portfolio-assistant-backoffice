---
name: web-verify-backoffice
description: "Verify backoffice authorization, operational states, keyboard behavior, responsive layouts and EN/ES themes with real PostgreSQL and synthetic operations. Not public conversation QA or deployment."
---

Read the [operating contract](../../../AGENTS.md). Establish the affected flow and whether
fixes are authorized. Review-only requests remain read-only. Follow [README](../../../README.md)
commands with pinned Node, frozen dependencies, a production build, Playwright engines
and an isolated PostgreSQL database whose name includes test or fixture. Never point
fixture or migration tools at shared data or stop unrelated services to free a port.

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
