# Embedded assistant protocol v1

Status: implementation and local verification in progress. The production portfolio is
not changed by this repository. One assistant controller/transport/chat serves primary `/embed` and the public standalone
`/` development/demo surface; only the shell and preference ownership differ. No API contract change is needed.

## Prioritized acceptance checklist

1. Shared compact shell, safe protocol and session behavior: implemented; tests pending.
2. Cross-origin harness, keyboard/mobile/security/failure flows and standalone regressions:
   in progress. Inspect rendered evidence before approval.
3. Committed portfolio/vps-ops handoff, skills and CI: in progress. Production integration,
   real phones and human assistive-technology review remain unverified.

## Host responsibilities

Embed `https://assistant.gonzalomartinperez.com/embed?theme=dark&locale=en`.
Only `theme=dark|light` and `locale=en|es` are read; invalid/missing values become dark/en.
These are initial non-sensitive hints; validated host initialization owns later preferences.
Embedded preferences never read/write standalone localStorage. Standalone keeps its own
controls. No credentials, conversation IDs or transcript belong in the URL or messages.

Create the iframe on first open, after registering the message listener. Keep the exact
instance mounted during minimize/maximize. Put the host in a stable portfolio layout to
survive internal navigation; removing it ends network requests and loses unsent drafts.
Maximize changes CSS dimensions, not the Fullscreen API. Desktop target is a compact
440px panel; mobile fills the dynamic viewport with safe-area-aware host controls.

Use a **non-modal named region**, not `aria-modal` or a cross-frame focus trap. Give the
iframe an accessible localized title. Host owns one set of minimize/maximize
controls; the embedded conversation menu only manages saved conversations. Keyboard Tab
and Shift+Tab cross the iframe naturally. Move focus into the composer only after ready
and explicit opening. Escape in the chat requests minimize, except when consumed by its
conversation menu/edit action. Minimize must hide and make the entire panel inert, move
focus back to the launcher, and set `aria-expanded=false`. Keep the rest of the portfolio
usable. A future modal design needs separate cross-frame containment tests and is not v1.

Send hidden visibility before minimizing; it pauses token-driven presentation subscriptions
and decorative animation without aborting a previously authorized response. Reopen consumes
the latest controller snapshot. Never treat minimize as clear, delete, retry or regenerate.

## Wire messages

[JSON Schema v1](../contracts/embed.v1.schema.json) and [handshake examples](../contracts/embed.v1.examples.json).
Canonical types and runtime validator: [protocol.ts](../src/features/embed/protocol.ts).
Every object has numeric `version: 1`. Extra keys, unsupported enums/types/versions and
arbitrary navigation/actions are rejected. No dynamic HTML, URLs or model output crosses
this protocol. Host validates the iframe's exact `event.origin` AND `event.source ===
iframe.contentWindow`; assistant checks the allowlist AND `event.source === window.parent`.
All sends specify the exact destination origin. Parent-domain sharing is not same-origin.

| Direction | Type | Additional fields |
| --- | --- | --- |
| Assistant → host | `assistant.ready` | `status`: `initializing`, `ready`, `unavailable`, `expired` |
| Host → assistant | `host.initialize` | `preferences: {theme, locale}`, `visible: boolean` |
| Host → assistant | `host.preferences` | `preferences: {theme, locale}` |
| Host → assistant | `host.visibility` | `visible: boolean` |
| Host → assistant | `host.focus` | none; focus composer when visible |
| Assistant → host | `assistant.request-minimize` | none; Escape |

Register before appending iframe. Assistant announces readiness on mount and meaningful
session changes. On the first validated announcement, host sends initialize once. Assistant
acknowledges with its current ready status; host must not answer every acknowledgement with
another initialize (no handshake loop). Preference/visibility/focus messages are ignored
before initialization. Unknown versions fail closed. Additive fields require coordinated
versioning because v1 deliberately rejects unknown keys.

```js
iframe.contentWindow.postMessage({
  version: 1,
  type: 'host.initialize',
  preferences: { theme: 'dark', locale: 'en' },
  visible: true,
}, 'https://assistant.gonzalomartinperez.com');
```

`load` is not readiness. Allow eight seconds for an operational ready status; show a
localized unavailable notice, explicit retry on timeout. Keep
host navigation usable. Retry may recreate only a frame that never became ready; an
operational conversation must use its existing reconnect action, which reads saved state
and never resends generation. API unavailability/expiration is also shown inside the chat.

## Headers, origins and runtime configuration

Application `src/proxy.ts` emits `Content-Security-Policy: frame-ancestors 'none'` plus
`X-Frame-Options: DENY` for `/`. `/embed` emits exact allowed frame ancestors, no XFO,
and `Cache-Control: private, no-store`. This Next hook only sets page headers; it does not
proxy API traffic. Browser API remains relative `/api/v1`, routed directly to FastAPI.

`EMBED_ALLOWED_ORIGINS` is a server-runtime comma-separated origin allowlist, default
`https://gonzalomartinperez.com`. It is validated for both response CSP and serialized
protocol configuration: at most eight exact HTTPS origins, with HTTP allowed only for
localhost/127.0.0.1 development. Paths, credentials, wildcards and opaque origins fail
without printing values. Changing this non-secret variable needs a restart, not rebuild.
No sibling service URL or secret is exposed. Do not add preview origins without review.

Portfolio must permit `frame-src https://assistant.gonzalomartinperez.com`. vps-ops must
preserve the route-specific policy and avoid duplicate conflicting CSP/XFO from Coolify
or Cloudflare. A stricter added frame-ancestors policy will still block embedding. Verify
effective HTTPS response headers and actual frame loading after deployment. No production
header claim follows from the local test proxy.

The reference harness intentionally uses no sandbox: isolation is by cross-origin policy,
CSP and validated messages. A sandbox that removes `allow-same-origin` breaks cookie/origin
semantics. Do not add sandbox capabilities speculatively; if selected by the portfolio,
test scripts, same-origin session access, clipboard and external links separately. Grant
only `clipboard-write` via iframe permissions for the implemented copy button; denial
retains manual-copy feedback. No camera, microphone, geolocation or parent navigation.

## Sessions

The iframe makes same-origin API requests; host portfolio does not receive credentials or
call the API. HTTPS portfolio and assistant are different origins but same-site under the
proposed domains. Keep secure host-scoped HttpOnly session cookies and API CSRF checks.
Cookie restrictions and deployments on unrelated preview sites can affect continuity.
Do not weaken SameSite or add URL tokens to hide those limitations.

There is no routine new-window action, cross-tab transfer or arbitrary host navigation in
v1. The standalone demo remains public and uses the same authorization/rendering defenses.
Blocked or expired cookies require explicit reconnect and may yield a new anonymous session.
Never retry generation automatically or put credentials in URLs to work around cookie policy.

## Verification and ownership checklist

Local harness: `npm run preview:fixture`, then `http://localhost:3110`; assistant is on
`http://localhost:3107`. The two origins exercise real browser postMessage/CSP boundaries.
Harness code lives in `tests/fixtures/embed-host.html`, is not in public assets or the
production image, and is not a second product frontend. `npm run test:browser` includes
embed tests in all installed engines; `npm test` checks payload/origin validation.

Portfolio owner must implement its approved launcher/panel styling, localization, stable
layout, same-frame persistence, handshake, timeout/retry, focus restoration and permissions.
Replace its existing direct-API panel only through coordinated portfolio work; do not keep
two concurrent chat/session implementations. vps-ops owns production allowlist, effective
headers, TLS, proxy routing and deployment. Frontend owns this versioned protocol. API pin
remains `6b1e65f2406ba5ddf21d15c56c34ccf672d90bbb`.

References: [postMessage security](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
and [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).
Installed Next 16.3.6 proxy, page/searchParams and response-header documentation was read
before implementation. Local verification does not establish production portfolio completion.
