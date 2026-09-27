# Conversation interaction acceptance checklist

Baseline: develop `0cd71d9`, Next 16.3.5, WSL Linux, Chromium 1440×1000 and
390×844. Portfolio reference remains `45d8a42faa78bfb94952639ed462832c3b4ad109`.
Synthetic deterministic HTTP/SSE fixture; no personal conversations or paid provider.

Observed friction: repeated introductory warnings and generous empty-state spacing push
the third starting question below the visible mobile transcript. Answers lack copy controls.
The existing source, stop, recovery, feedback and conversation-management flows are retained.

Acceptance criteria:

- Three starting questions remain accessible with the composer visible; less repeated copy.
- Copy reports success only after clipboard resolution, provides a usable failure message,
  and never sends or alters the conversation.
- Two editorial follow-up questions fill/focus the draft, never auto-generate or claim to be
  backend recommendations. They appear only after a completed, readable answer.
- One decorative avatar depth/halo effect preserves the approved asset and has no keyboard
  stop or hidden action. Precise-pointer motion cleans up; coarse input keeps native gestures;
  reduced motion disables transforms/animation.
- Both locales/themes, narrow/larger mobile/tablet/desktop, keyboard, axe, interruption,
  source security, scroll-follow and unmount regressions pass.
- Inspect before/after screenshots and a short interaction recording. Measure the production
  JS payload in the same environment; no animation/runtime dependency is added.
- Production ownership moves in documentation to vps-ops; no deployment is activated.

Baseline client chunks: 1,119,067 raw bytes / 343,820 gzip bytes, summed individually by
`node scripts/measure-bundle.mjs`. This is build output, not a field performance metric.

## Consolidated remaining-work checklist

1. **Master UX upgrade** — implement useful frontend interactions on the existing state and
   pinned transport; verify the full conversation/security/accessibility matrix, rendered
   before/after evidence and bundle impact. Backend personality changes remain API-owned;
   no new wire actions are assumed. Status: implementation complete, verification in progress.
2. **Repository skills** — four canonical workflows, two client discovery paths, isolated
   validator regressions and honest behavior/client limits. Status: PR #13 passed full CI;
   both clients also discovered the catalog from a clean Linux clone without model calls.
3. **Deployment handoff** — committed application runtime contract for Coolify/vps-ops,
   local fixtures retained, no production controller or trigger. Status: implemented;
   final image/check verification pending. Package visibility and VPS-only validation deferred.

Across all three: preserve architecture, strict typing, safe rendering, pinned API provenance,
reproducible CI, existing work and develop-only integration. Main promotion requires the owner-authorized develop-to-main PR and its full passing CI;
production remains disabled.
Physical devices, human screen-reader testing and actual Coolify deployment are unverified.

## Inspected visual evidence

| State | Before | After |
| --- | --- | --- |
| Desktop, English/dark | [Empty](interaction-polish/before-desktop.png) | [Empty](interaction-polish/after-desktop.png) |
| Mobile 390×844, Spanish/light | [Empty](interaction-polish/before-mobile.png) | [Empty](interaction-polish/after-mobile.png) |
| Desktop conversation | [Answer](interaction-polish/before-conversation-desktop.png) | [Answer and actions](interaction-polish/after-conversation-desktop.png) |
| Mobile conversation | [Answer](interaction-polish/before-conversation-mobile.png) | [Answer and actions](interaction-polish/after-conversation-mobile.png) |

[17.7-second signature interaction and draft-selection demo](interaction-polish/signature-demo.webm).
Rendered screenshots and a decoded recording frame were inspected, not inferred from tests.
At 390×844 the empty transcript changed from 555px content / 473px visible to 473px / 473px:
all three starting questions fit above the composer. Narrower or enlarged text can still
scroll naturally. Chromium coarse-pointer emulation confirmed native touch-action:auto and
an avatar tap did not change the draft. This is not physical-device evidence.

The first regression run passed 54/54 cases across Chromium, Firefox and WebKit (2.4m).
A bounded read-only review then identified focus loss when disabling a pending copy button.
The fix uses aria-disabled with the existing single-flight guard; a delayed clipboard test
checks focus after both success and denial, and rejects duplicate writes. Security/architecture
review found no further actionable issues. Final results follow after testing that correction.


## Corrected local image verification

The final interaction image (Next 16.3.5, linux/amd64) built successfully from the frozen
lockfile: local image ID `sha256:01e207190b4345ed20fe9313c804904291557e3dd041c6e6f7f53710dc625ab6`,
96,545,957 image bytes. This is a local image ID, not a published registry digest.
The non-root/read-only container became healthy with only the documented tmpfs mounts;
logs had no optimizer/write errors and SIGTERM stopped the process within the 20s grace.
The six copy/follow-up/identity cases and three delayed-clipboard focus cases passed across
all engines against this image. CI will run the entire expanded 57-case matrix.

Same-environment Next 16.3.5 client chunks after the focus fix: 1,122,305 raw / 344,787 gzip
bytes, versus 1,119,067 / 343,820 before (+3,238 raw, +967 gzip; about 0.28% gzip).
This is summed build output, not transferred route bytes or field Core Web Vitals. Avatar
pointer movement updates CSS through a coalesced frame; it does not set React state or
reparse message Markdown. Memoized completed messages and token rendering are unchanged.
One container sample during browser checks used 59.67 MiB; this is not a capacity guarantee.

Formatting, lint, strict typing, 29 unit/contract/boundary/skill tests, generated provenance,
local documentation links, redacted public-file scanning and Actionlint 1.7.12 passed.
`npm audit --audit-level=moderate` reported zero vulnerabilities. Structural secret scanning
is limited to high-confidence patterns. No paid model, production or physical-device test ran.
