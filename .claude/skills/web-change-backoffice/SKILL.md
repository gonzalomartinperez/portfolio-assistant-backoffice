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

For dashboard charts use the existing Recharts client boundary and semantic data table;
pass validated aggregates only. Preserve token colors, both locales and disabled chart
animation. Snapshot totals are not historical trends. Prometheus/Grafana infrastructure
belongs to vps-ops; do not expose datasource credentials or embed shared dashboards.

For workbench changes read [design decisions](../../../docs/design-system.md) and
[acceptance](../../../docs/verification/operations-workbench.md). Preserve observed windows,
nullable latency, reservation/settlement separation and zero-budget semantics. Native
trace filters operate on validated IDs/outcomes only; relative phase bars are not a
waterfall. Optional Grafana links require the owned URL validator and runtime configuration,
not arbitrary payload destinations. Test compact/landscape layouts and 200% text.

Access policy and mutation ports live in `auth/domain` and `auth/application`.
Server Actions decode/authorize and format outcomes; PostgreSQL rechecks the owner
inside each transaction. Test both fake-port use cases and isolated database behavior.
`npm test` includes cycle and transitive client/server guards; new import/composition
patterns need negative probes, not broader exceptions. See [architecture](../../../docs/architecture.md).

For product counts read [analytics semantics](../../../docs/product-analytics.md).
Keep the server-runtime flag off by default, require live membership before reads,
validate the separately pinned schema and retain table alternatives. Never equate
interactions with people, completed downloads or exact generation totals. Read
[privacy review](../../../docs/privacy-review.md) before changing notices; IAM session
metadata and essential cookies are not anonymous product analytics.

This is `portfolio-backoffice`, the project's private operations UI. Read
[ADR006](../../../docs/adrs/006-project-backoffice.md) before naming or scope changes.
Website analytics and assistant health are separate features composed by the server;
repository renaming never authorizes renaming cookies, IAM tables, health IDs or data.
