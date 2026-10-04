# Native assistant and backoffice delivery

One checklist; evidence must describe actual behavior, not intentions.

| Priority | Deliverable | Status / acceptance |
| --- | --- | --- |
| 1 | Preserve work, coordinate writers | Isolated portfolio/auth/CI worktrees; no API/vps-ops changes |
| 1 | Native portfolio chat | In progress in portfolio task PR; retain public HTTP/SSE capabilities before retiring web routes |
| 1 | API synchronization | Portfolio imports committed API snapshot; operational contract remains proposed |
| 2 | OAuth and invited access | Implemented; real PostgreSQL/fake-provider tests cover owner and invitation callback, consumption and revocation; live providers pending |
| 2 | Safe operational dashboard | Implemented and cross-browser verified with labeled fixtures; eight transport/validation tests; real API blocked |
| 3 | Native UX | Compact/maximized/mobile/page, continuity, sources, themes/locales, focus and keyboard |
| 3 | CI and image | Managed real-DB browser fixtures pass all three engines; exact hardened image migration and GitHub release PR checks in progress |
| 4 | Skills and docs | Four focused workflows updated; validator and actual Codex/Claude discovery pass without model calls; clean-checkout discovery passes in both clients |
| 4 | Rename and PR integration | Public GitHub repo renamed portfolio-assistant-backoffice; Dependabot26 and27 merged after passing current-head CI; product PRs pending |
| blocked | Real operational telemetry | API owner must publish additive contract and instrumentation |
| deferred | Production | Coolify/vps-ops, real OAuth registrations, DNS, effective proxy/security headers and phone tests |

Standalone assistant baseline: frontend `aed8ea710c8b847ddc9066aaef5ce48d3793b494`.
Production build passed locally. Chromium/Firefox/WebKit fixture probes preserved one frame across
minimize/maximize, synced preferences and handled Escape. A hidden stream completed once; no paid
API was exercised. Current native and backoffice evidence will replace these historical claims.
