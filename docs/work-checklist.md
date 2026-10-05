# Native assistant and backoffice delivery

One checklist; evidence describes actual behavior, not intentions. Source changes are
integrated into develop through backoffice PR28 (`51f638487cbcb3cedc0bff1678a25892f9099063`)
and portfolio PR94 (`83a4ecde0591da9c35c939a8c6b82dc9b010fdc6`). Main and production remain separate.

| Priority | Deliverable | Status / acceptance |
| --- | --- | --- |
| 1 | Preserve work and ownership | Completed: isolated worktrees and merged target-branch changes; no API/vps-ops edits |
| 1 | Native portfolio chat | Completed: persistent compact/maximized/mobile/page presentations; 31 unit/network, 68 targeted browser checks and final 388 full-matrix checks pass |
| 1 | API synchronization | Public API c6012067 verified without interception in three engines using fixture generation; operational contract remains proposed |
| 2 | OAuth and invited access | Implemented and PostgreSQL fixture integration verified: owner admission, invitation callback/consumption and revocation; live providers pending |
| 2 | Operational dashboard | Completed against labeled fixtures: bounded validation, honest unavailable states, interactive Recharts aggregates and semantic tables; real API blocked |
| 3 | UX and accessibility | Verified EN/ES, dark/light, compact/maximized/mobile/page, continuity, sources, keyboard, reduced motion and 200% text; physical devices/assistive technology pending |
| 3 | CI and production image | Completed: current-head backoffice run37247552502 passes exact-image migration/auth/browser checks; native run37248316043 passes all required gates and Hostinger compatibility |
| 4 | Skills | Four canonical workflows; structural/negative tests and actual Codex/Claude discovery pass in working tree and clean Linux clone; model-driven routing/invocation unverified |
| 4 | Rename and dependencies | Public repo renamed portfolio-assistant-backoffice; Dependabot26/27 merged with required checks; security-alert/fix proposals enabled; conservative automatic arming stays disabled pending safe activation |
| 4 | Deployment handoff | Committed application image/runtime/Coolify contract and private monitoring request; vps-ops owns shared production execution |
| blocked | Real operational telemetry | API owner must publish additive contract/instrumentation; no live metrics or trends are claimed |
| deferred | Production acceptance | Real OAuth registrations, OpenAI evaluation, image-publication approval, Coolify/DNS/effective headers, backups and device testing |

[Backoffice evidence](verification/backoffice.md) includes inspected fixture screenshots.
[Native evidence](https://github.com/gonzalomartinperez/portfolio/blob/develop/docs/verification/native-assistant.md)
records actual compact/mobile/page and API integration verification. Historical iframe
baseline is preserved in Git, not presented as the current implementation.
