---
name: web-change-assistant
description: "Implement or review assistant UI and conversation behavior within this frontend’s feature boundaries, including theme, bilingual copy and safe rendering. Not for importing API snapshots or production deployment."
---

Use the current request to decide whether to inspect or implement. Read the repository
[operating contract](../../../AGENTS.md); a skill is not authorization to edit or publish.
Obtain the expected behavior, affected flow and failure case before selecting a layer.
For review-only requests, return findings without edits, commits or PR mutations.

1. Inspect git status/diff and the relevant entry points; preserve existing work and
   coordinate overlapping writers. Read [architecture](../../../docs/architecture.md)
   and [coding conventions](../../../CONTRIBUTING.md), not the entire documentation tree.
2. Place pure lifecycle/transition changes in [domain](../../../src/features/assistant/domain/models.ts),
   request ownership in [application](../../../src/features/assistant/application/assistant.ts),
   wire validation in adapters, and interaction/rendering in presentation. Only
   [entry.tsx](../../../src/features/assistant/entry.tsx) composes concrete transport.
   React must not parse SSE or choose credential/retry policy. EOF is not completion;
   preserve partial answers, cancel readers, reject stale responses and never auto-resend.
3. For UI/copy changes, read [design conventions](../../../docs/design-system.md).
   Extend existing native button variants and CSS Modules; preserve data-theme, font
   identity, semantic tokens and both dictionaries. Avoid a second shadcn preset/library.
   Keep avatar motion decorative, fine-pointer-only and static under reduced motion;
   release listeners/frames on unmount. Suggestions fill drafts rather than generating.
   Copy feedback must follow clipboard success and handle permission failure.
   Model Markdown remains sanitized, without raw HTML, remote images or unsafe URLs.
4. Add a behavioral regression at the responsible boundary. Run `npm run typecheck`,
   `npm run lint` and `npm test`; use the browser matrix in the README for visible changes.
   Read installed Next documentation before changing framework-specific behavior.

Return the changed behavior, layer choices, actual checks and unresolved limitations.
If Node/dependencies are absent, report prerequisites from the [README](../../../README.md);
install only within task authority. Stop dependent work for an incompatible wire contract
or a required API/portfolio edit; provide an exact handoff and continue independent fixture work.
Never copy a sibling working tree, private career material or credentials into this repository.

For embedded presentation changes, read the [v1 handoff](../../../docs/embed-integration.md).
Keep one chat/controller and separate host protocol state. Verify exact origin/source checks,
same-frame minimize/maximize, hidden streaming, cross-frame focus and standalone regressions
with the cross-origin harness. Do not edit the portfolio or infer production deployment authority.
