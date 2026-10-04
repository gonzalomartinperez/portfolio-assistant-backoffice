# Native assistant and backoffice delivery

One checklist; evidence must describe actual behavior, not intentions.

| Priority | Deliverable | Status / acceptance |
| --- | --- | --- |
| 1 | Preserve work, coordinate writers | Isolated portfolio/auth/CI worktrees; no API/vps-ops changes |
| 1 | Native portfolio chat | In progress in portfolio task PR; retain public HTTP/SSE capabilities before retiring web routes |
| 1 | API synchronization | Portfolio imports committed API snapshot; operational contract remains proposed |
| 2 | OAuth and invited access | In progress; Google/GitHub, verified owner, owner/viewer and immediate revocation |
| 2 | Safe operational dashboard | Seven mapper/transport tests pass; authenticated UI and real operational API pending |
| 3 | Native UX | Compact/maximized/mobile/page, continuity, sources, themes/locales, focus and keyboard |
| 3 | CI and image | In progress; one tested image, isolated DB, required gate, SHA actions and no publication |
| 4 | Skills and docs | Update implemented responsibility; preserve each repository's discovery convention |
| 4 | Rename and PR integration | Pending parity and passing required checks; develop only |
| blocked | Real operational telemetry | API owner must publish additive contract and instrumentation |
| deferred | Production | Coolify/vps-ops, real OAuth registrations, DNS, effective proxy/security headers and phone tests |

Standalone assistant baseline: frontend `aed8ea710c8b847ddc9066aaef5ce48d3793b494`.
Production build passed locally. Chromium/Firefox/WebKit fixture probes preserved one frame across
minimize/maximize, synced preferences and handled Escape. A hidden stream completed once; no paid
API was exercised. Current native and backoffice evidence will replace these historical claims.
