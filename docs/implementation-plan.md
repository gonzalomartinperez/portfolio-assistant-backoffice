# Assistant architecture and experience plan

## Starting point

Preserve and extend the existing uncommitted `feat/quality-chat` work: chat layout,
fonts/avatar, Markdown, localization, validation, HTTP/SSE changes and associated tests.
The files were last edited September 26 and remained stable during inspection; no
other frontend test/server/writer activity was observed. API and portfolio are read-only.
Baseline: five parser/validation tests and lint pass. Capture the existing rendered
UI before moving files. Record build, browser and transfer measurements in verification.

Portfolio reference: `45d8a42faa78bfb94952639ed462832c3b4ad109`.
Start with the committed frontend contract `44401b4d76f3ea065a30299351e3c48ee75e2e5e`;
validate the existing provenance update to API `492e976f58a5febbb5f51d7588b501fe36f161d2`
against committed artifacts, never the API working tree. Await an explicit new API
handoff before adopting further contract changes.

## Implementation slices

1. Separate assistant domain models/transitions, application operations and ports,
   HTTP/SSE adapters, and React presentation; enforce imports with an AST test.
2. Make request ownership and lifecycle explicit. Abort deterministically, reject stale
   completions, preserve interrupted content, recover saved history without resending.
   Retain history, rename, deletion and feedback.
3. Carry the portfolio tokens, type and identity into scoped composition styles and
   owned controls; improve mobile, focus, theme replay, bilingual copy and announcements.
4. Add deterministic mocked HTTP/SSE browser coverage, state/operation/transport tests,
   accessibility and cross-browser checks, screenshots and production smoke coverage.
5. Document architecture, contract refresh, design adaptations, setup and limitations;
   commit scoped work, open PR into develop, pass required checks/reviews and merge.

## Observable acceptance

All lifecycle states have explicit representations. Streaming never treats early EOF as
success; stopping cannot submit again until the previous operation settles. Readers are
cancelled on failure/unmount. React never consumes wire event envelopes. Domain imports
no platform or transport code. Unsafe links/raw HTML/images cannot execute model content.
Both locales/themes support keyboard and narrow layouts; reading history never jumps to
new tokens and a latest-message control is available. CI uses one managed web server,
frozen install, pinned actions, strict checks and useful browser failure artifacts.
No paid model calls, production deployment, main merge or reference-repository writes.
