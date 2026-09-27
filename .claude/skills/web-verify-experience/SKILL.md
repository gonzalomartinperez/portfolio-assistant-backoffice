---
name: web-verify-experience
description: "Verify the assistant’s real chat experience across keyboard, mobile layouts, English/Spanish and light/dark themes using deterministic browser and accessibility checks. Not a generic screenshot or deployment workflow."
---

Read the [operating contract](../../../AGENTS.md). Required inputs: the flow/change under
review and whether fixes are requested. A read-only review does not authorize source edits,
commits or publishing screenshots. Test output belongs in ignored artifact directories and
must contain synthetic conversations only.

Start with the [README verification commands](../../../README.md) and
[browser suite](../../../tests/browser/chat.spec.ts). Node from .nvmrc, locked npm dependencies,
Playwright engines and a production build are prerequisites. If unavailable, report the gap;
do not claim emulation, axe or an unexecuted test proves a real device experience.

Build with `NEXT_PUBLIC_ASSISTANT_API_URL= npm run build` so a local environment file cannot
redirect tests to a real service. Run `npm run test:browser`; its managed fixture lifecycle
owns loopback ports 3107/3108/8107. Never stop an unrelated process to free them. This exercises
actual HTTP/SSE against a deterministic mock, not a paid provider or live API.

Inspect rendered screenshots and failures, not just the exit code. Review completed and
interrupted conversations, sources, stop/recovery, drawer/confirmation focus restoration,
IME and Enter/Shift+Enter, long content, near-bottom auto-follow and jump-to-latest.
Use the existing 320/430 mobile, tablet, landscape and desktop cases with both themes/locales.
Verify copy success/failure, draft-only follow-ups, pointer capability and avatar cleanup.
Check reduced motion, blocked preference storage and the keyboard-sized viewport. Screen
reader announcements should describe lifecycle progress, not every token.

For a rendering/security finding, trace [message rendering](../../../src/features/assistant/presentation/chat-message.tsx)
and the adapter validator; do not execute returned code or fetch model-supplied embeds.
Fix only if requested and rerun the relevant regression plus required checks. Distinguish
mocked browser results from the separately pinned live suite in the README.

Return exact commands, engines/viewports, findings with reproduction, artifact locations and
physical-device/human screen-reader limitations. Existing [evidence](../../../docs/verification/quality-chat.md)
is historical context, not proof that the current change passes. Do not publish test artifacts
containing credentials or personal conversation text.

For embedded presentation changes, read the [v1 handoff](../../../docs/embed-integration.md).
Keep one chat/controller and separate host protocol state. Verify exact origin/source checks,
same-frame minimize/maximize, hidden streaming, cross-frame focus and standalone regressions
with the cross-origin harness. Do not edit the portfolio or infer production deployment authority.
