# Release-candidate acceptance

This bounded checklist supplements the implementation plan. A candidate is not a production
release; remaining deployment/device gates are explicit in the verification report.
The current three-deliverable status and evidence live in the [interaction checklist](verification/interaction-polish.md).

| Gate | Acceptance evidence |
| --- | --- |
| Preserved scope | Existing quality-chat work incorporated; only this frontend changed; develop-targeted PR |
| Architecture | Pure lifecycle models, transport ports/mapping, deliberate React composition; resolved-path and dynamic-import negative tests |
| Full flows | Bootstrap/history/send/source/stop/interruption/reconnect/rename/delete/feedback; no automatic generation retry |
| Race safety | Delayed feedback, stale history, partial correlation, rapid submit/stop, creation/unmount cancellation tests |
| Untrusted data | Validated HTTP/SSE, safe Markdown/links, no remote model images, no-store credentialed requests |
| Accessible UI | Both languages/themes, five viewports plus keyboard-sized viewport, keyboard/focus/IME/zoom/scroll behavior, axe and inspected screenshots |
| Tooling | Frozen npm install, Biome adaptations, strict TypeScript, unit/contract/import checks, generated drift, production browser tests |
| Public project | README screenshots/setup/status, CONTRIBUTING, SECURITY, MIT scope/attribution, templates, update configuration, redacted scan/local links |
| Integration | Required checks and live-fixture CI pass before normal PR merge; main and production untouched |

Read-only architecture/security and accessibility reviews found feedback lifecycle, stale
partial-recovery and focus-restoration bugs. Those findings are covered by regression tests.
No review agent modified the worktree. Final counts, artifact paths, measurements and limits
are recorded in [verification](verification/quality-chat.md).

Follow-ups outside candidate approval: physical iOS/Android keyboard/browser-chrome testing,
human assistive-technology review, deployed HTTPS/CORS/cookie configuration, provider quality
assessment under separate paid-call authorization. These are not represented as completed tests.
