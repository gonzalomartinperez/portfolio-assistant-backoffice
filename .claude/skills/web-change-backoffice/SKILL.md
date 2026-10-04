---
name: web-change-backoffice
description: "Implement or review authenticated assistant operations, invited access and bilingual backoffice UI within feature boundaries. Not public chat, API implementation or deployment."
---

Read the [operating contract](../../../AGENTS.md) and establish whether the request
allows edits. Inspect status and relevant diffs; preserve other writers' work. Read
[architecture decision](../../../docs/adrs/004-native-chat-and-private-operations.md)
and [coding conventions](../../../CONTRIBUTING.md), not the whole documentation tree.

Choose the responsible boundary: pure operations models in domain, small read ports in
application, bounded HTTP/runtime validation in adapters, server composition in entry,
and presentation components for interaction. Authentication guards live in
[auth](../../../src/features/auth/server.ts); every protected page/action/API checks
live membership. Hiding a control is not authorization. Never expose service tokens,
provider secrets, prompts or transcript text through props, logs or browser storage.

For access changes read [authentication](../../../docs/authentication.md). Preserve
verified-email admission, explicit account linking, single-use invitations and live
revocation. Do not add password login or open signup. For UI preserve data-theme,
semantic tokens, both dictionaries, native controls and reduced motion. Missing metrics
are unavailable, not zero. Fixture values must be explicitly labeled.

Use runtime validation for external data; generated types alone do not establish trust.
Read installed Next documentation before framework changes. Run `npm run typecheck`,
`npm run lint` and `npm test`; follow README browser verification for visible behavior
and `npm run test:auth` for admission/session changes against an isolated test database.
Report commands actually executed, changed behavior and remaining integration gaps.

Missing prerequisites stop dependent checks. An absent committed operational contract
requires a precise backend handoff, not invented production capabilities. Public chat
belongs to the portfolio; this skill does not authorize changes to another repository.
