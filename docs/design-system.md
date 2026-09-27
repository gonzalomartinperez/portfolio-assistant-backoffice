# Design system and provenance

Read-only portfolio reference: `45d8a42faa78bfb94952639ed462832c3b4ad109`.
Reviewed `docs/design.md`, `components.json`, `src/app/globals.css`, owned button/input
primitives, fonts/layout and theme behavior. No runtime import crosses repositories.
The existing assistant work's approved avatar is retained without distortion.

Token authority is `src/app/style.css`: portfolio surface, text, control-border and cyan
accent values in both themes, plus assistant-specific danger and accent-ink colors.
Inter is body text, Inter Tight is display type, JetBrains Mono is limited to short labels.
Next/font self-hosts the fonts. `data-theme` remains the only theme authority.

`components/ui/button` adapts the portfolio's owned shadcn button responsibilities:
native semantics, default/outline/ghost variants, 44 px targets, focus ring and disabled
states. These few controls use CSS Modules instead of adding Tailwind, CVA and Radix Slot
to an app that had none. This is a deliberate dependency-saving adaptation, not a second
preset. Native select/textarea retain labels and platform interaction. There is no new
icon library, theme provider, reset, animation library, image generation or Three.js scene.

Feature CSS Modules own sidebar, transcript, message, citation and composer geometry.
Global CSS is limited to tokens, reset, type and screen-reader utility. Source links use
understandable paths and optional line ranges; unsafe protocols and unsupported citations
are removed at the adapter. Raw HTML and remote images are disabled in model Markdown.
External HTTPS links use noopener/noreferrer and never execute returned code.

Dark/light controls have explicit default, hover, focus, pressed, loading, disabled and
error states. Motion respects reduced-motion. Empty states are real suggestions, not
fabricated answers; waiting labels reflect actual requests. Copy identifies this as an AI
assistant and does not call generated text verified. Retention copy interpolates the
service-provided duration rather than hard-coding an assumption about local storage.

The English dictionary defines the complete key shape; the Spanish dictionary must
satisfy the same mapped type. Use full translated sentences and typed interpolation.
US English and neutral Latin American Spanish are required.

## Conversation interactions

The empty state uses three editorial prompts; completed answers offer two general follow-up
questions. Both fill and focus the draft without sending, predicting relevance or claiming
backend-provided actions. Copy uses the Clipboard API and reports success only after it
resolves; unavailable/denied access gives a localized manual-selection fallback. No transcript
is persisted locally. Existing source and feedback controls retain their real API behavior.

`IdentityAvatar` owns one decorative depth/halo effect around the approved face. It is hidden
from assistive technology and has no keyboard stop or conversation action. Fine mouse input
updates bounded rotation through one pending animation frame, without React state per frame.
Pointer exit/cancel, media changes, window blur and unmount reset/cancel resources. Coarse
input has only a restrained pressed halo; native scrolling/zoom/selection are untouched.
Reduced motion removes the halo and transform entirely. There is no WebGL or new dependency.
The portfolio's 140ms/320ms durations and easing are semantic global tokens; only suggestion
presses use small scale feedback. Reading surfaces and streaming tokens do not animate.

See [interaction acceptance and evidence](verification/interaction-polish.md) for baseline,
regressions, screenshots and performance measurements. Run the browser suite for clipboard
failure/success, draft semantics, pointer capability, reduced motion and cleanup, in addition
to the existing keyboard, scrolling, source-security and locale/theme matrix.
