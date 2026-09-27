# Architecture and streaming

The root page/layout are Server Components. `features/assistant/entry.tsx` is the
composition root and intentional client boundary for locale, theme, conversation
navigation and chat. It constructs one controller and one HTTP transport per mount.
There is no backend-for-frontend, shared runtime package or new state library.

- `domain`: independent conversation/message types, lifecycle union and pure transition
  rules. No React, Next, generated schemas, browser globals or network imports.
- `application`: a subscribable controller and narrow transport/runtime ports. It owns
  request lifetimes, single-flight generation, selection versions and operations.
- `adapters`: credentialed HTTP, runtime validation, generated-type compatibility,
  bounded SSE framing and wire-to-application progress mapping.
- `presentation`: React subscription, interaction state, safe Markdown and scoped CSS.
- `shared`: bilingual dictionaries and preference handling; no general utility bucket.
- `components/ui`: owned native control variants adapted from the portfolio primitives.

`tests/unit/boundaries.test.ts` traverses TypeScript imports and identifiers. Domain
and application cannot reach presentation/infrastructure; presentation cannot import
adapters/generated contracts/server-only modules. Only the public API origin is allowed
as a `NEXT_PUBLIC_*` identifier. The composition root is the deliberate exception for
wiring concrete adapters to application ports.

## Lifecycle and ownership

`initializing → ready → submitting → streaming → completed | cancelled | failure`.
Initialization may instead become `unavailable`; an authenticated operation returning
401 becomes `expired`. Reconnection is explicit. `canSubmit` also requires loaded history,
no pending mutation and no unresolved local partial response. Conversation mutations and
selection controls are disabled during generation; this keeps one clearly owned stream.
Transport events never appear in React state.

Submit takes the lock before its first await, creates a conversation if necessary and
sends one request with a fresh idempotency key. No automatic generation retry exists.
Stop immediately aborts the reader; when a run ID is known it also attempts the pinned
cancel endpoint with a five-second bound. Closing/navigating away aborts all owned
requests; the pinned API marks disconnected runs interrupted. Selection versions prevent
late history from overwriting another conversation. Unmount suppresses notifications.

A terminal `run.completed` requires a validated `message.completed`. EOF without a
terminal event, malformed frames, identity/order changes and provider failures cannot
become successful answers. Partial text remains in memory with an incomplete label.
“Check saved conversation” fetches the session/list/history; it never resends a prompt.
If no saved answer exists, start a new conversation to leave an unresolved partial.
Partial text is not persisted in browser storage. Successful history is authoritative.
Pagination is followed with bounded page count and repeated-cursor detection.

The SSE reader incrementally decodes fatal UTF-8, handles CRLF/LF, split code points,
comments and multiline data, bounds frames to 64,000 characters and streams to 1 MB,
and rejects duplicate/decreasing sequences or identity changes. Completion, errors and
abort cancel and release the reader. Complete messages use sanitized Markdown; streaming
text is plain text, so no Markdown parser runs on every token. Completed message components
are memoized and their feedback callback stays stable.

## Preferences and accessibility

Only theme and locale are stored locally; all storage access is optional and guarded.
The pre-paint script sets `data-theme`, and hydration does not replay a dark default over
a saved choice. System mode uses CSS media queries under the same attribute authority.
Document language, title and description follow the selected language. The default server
metadata is bilingual; this single-route application does not publish locale-specific URLs.

Enter submits, Shift+Enter inserts a newline, and IME composition never submits. One
polite status announces connection/generation/completion/cancellation, not every token.
New content follows only within 120 px of the bottom; a latest-message button resumes
following. Mobile navigation traps focus, makes the conversation inert, supports Escape
and restores focus. Inline rename/delete confirmation returns focus to the conversation.
Native scrolling, dynamic viewport height, safe-area padding and horizontal code scrolling
support mobile without intercepting touch events. Physical keyboard/phone checks remain
separate from emulated browser verification.

## Shared embedded shell

The `/embed` Server Component supplies validated runtime origins and initial preferences to
the same composition root. `features/embed` owns the independent presentation protocol; it
never changes conversation transitions or parses API payloads. Hidden chat subscribers pause
while the controller completes an authorized stream. Reopen reads the latest snapshot.
The [embed handoff](embed-integration.md) is canonical for protocol and host responsibility.
