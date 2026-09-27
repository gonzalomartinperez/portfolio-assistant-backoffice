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
`node scripts/measure-bundle.ts`. This is build output, not a field performance metric.

## Consolidated remaining-work checklist

1. **Master UX upgrade** — implement useful frontend interactions on the existing state and
   pinned transport; verify the full conversation/security/accessibility matrix, rendered
   before/after evidence and bundle impact. Backend personality changes remain API-owned;
   no new wire actions are assumed. Status: implemented and verified locally and in CI; merges remain gated by the current PR checks.
2. **Repository skills** — four canonical workflows, two client discovery paths, isolated
   validator regressions and honest behavior/client limits. Status: PR #13 passed full CI;
   both clients also discovered the catalog from a clean Linux clone without model calls.
3. **Deployment handoff** — committed application runtime contract for Coolify/vps-ops,
   local fixtures retained, no production controller or trigger. Status: implemented and verified with the non-root/read-only image and local live/proxy checks;
   production execution remains outside this repository. Package visibility and VPS-only validation deferred.

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

The local interaction image before the touch-feedback correction (Next 16.3.5, linux/amd64) built successfully from the frozen
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

The local pinned FastAPI/PostgreSQL/Neo4j/Nginx fixture stack passed all four live browser
flows (18.4s). Proxy security/path/body-limit checks, a delayed flushing probe, disconnect /
cancellation, deletion and graceful active-stream drainage passed. The fixture answer had
23 deltas, first delta 167ms and total 280ms in this run; these are local fixture timings,
not provider or VPS latency. Only the dedicated verification project was stopped afterward;
its volumes and other agents' services were preserved.

Compatible Dependabot updates were reviewed and merged: Docker build-push action #8,
Next 16.3.6 #11, and setup-buildx action #9. Each passed the complete CI graph at its merge
head. TypeScript 7 (#12) was rejected after actual frozen-install ERESOLVE against the
contract generator's ^5.x peer; Node 26 types (#10) were rejected because runtime is Node 24.
Their major updates are held for a supported migration, not forced past checks. The final
combined PR also validates the Next patch and both Docker Action SHAs together with this UI.

A direct Chromium touch-start probe exposed unreliable CSS :active feedback on the decorative
avatar. Explicit passive pointer press/release tracking replaces that selector; cancellation,
window release, blur, media changes and unmount clear the attribute. The automated identity
case now verifies press, release, cancellation and reduced-motion suppression.


CI run 36331246177 on the combined Next 16.3.6 branch completed in 295s: static 26s,
image 113s, browser 169s, live fixture 120s and aggregator 4s. The browser job had two
WebKit retries, so that green aggregate was not accepted as final evidence. Its axe failure
showed 1.01:1 contrast during a theme transition: new text color against the still-transitioning
suggestion background. Text/surface interpolation was removed rather than delaying scans;
a frame-sampled 4.5:1 regression now covers both theme directions. Final CI must verify this
correction and the touch feedback together (60 browser cases).


Corrected UI run [36331922611](https://github.com/gonzalomartinperez/portfolio-assistant-web/actions/runs/36331922611)
passed **60/60 browser cases with no retries**, 29 static/unit/contract checks and four
live-fixture cases. Total elapsed 268s; jobs: static 30s, image 97s, browser 160s,
live fixture 131s, aggregator 2s. The contrast regression also failed against the previous
image at 1.011:1, demonstrating that it detects the bug rather than waiting past it.

The immutable conversational API handoff became available during final verification.
The frontend imported `6b1e65f2406ba5ddf21d15c56c34ccf672d90bbb` from public Git, with
handoff `4aadfc5d5b7604136b3123232a6103f50395ec00`. All four contract artifacts compare
byte-for-byte with the prior pin and generated types remain identical. The live gate now
checks a contextual follow-up in the same conversation without resending history. Proxy
body limits are reconciled to 32 KiB, with both a 20 KiB accepted request and oversized
rejection. Git is supplied by the pinned API image, so the duplicate indexer build is gone.

Like-for-like CI images using Next 16.3.6 contain 17 client JS chunks: baseline run
36330591051 has 1,119,130 raw / 343,584 gzip bytes; corrected UI run 36331922611 has
1,122,602 / 344,565 (+3,472 raw / +981 gzip, 0.29%). Measurement reads the saved image's
static chunk layers and compresses each with gzip level 6 in the same local process.
This includes no live performance or React commit-duration claim.


Final conversational-pin local verification passed **5/5 live browser flows (22.8s)**,
including same-conversation context/history persistence, plus the updated proxy smoke:
20 KiB padded request accepted, >32 KiB rejected, preserved paths, origin/CSRF, host cookie,
no-store, incremental output, disconnect/cancel/delete and graceful proxy drainage. The
fixture emitted seven deltas (85ms first / 124ms total); no live-provider claim follows.
The frontend runtime was the exact image downloaded from corrected UI CI run 36331922611.

Direct Chromium coarse touch-start/end now verifies the halo appears, returns to rest,
leaves the draft unchanged and disappears under reduced motion. The final local 60-case
matrix had 59 passes and one whole-flow WebKit 30s timeout under concurrent WSL load;
its trace/screenshot showed the completed deletion state. That case passed in isolation
(17.1s), with unchanged assertions/timeouts. The clean CI matrix passed all 60 without retries.

[Inspected full-stack fixture conversation with contextual follow-up](interaction-polish/live-context-desktop.png).
These are public-source excerpts from a deterministic API fixture, not paid model output.
Clean Linux clone: frozen npm install, 29 unit/contract/architecture/skill tests and both
clients' discovery passed. Physical phones, human screen-reader testing, live model answer
quality, production TLS/Coolify, registry publication and actual VPS load remain unverified.
