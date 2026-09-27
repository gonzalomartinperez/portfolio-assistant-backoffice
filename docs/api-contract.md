# Pinned API contract and refresh

Current API revision: `6b1e65f2406ba5ddf21d15c56c34ccf672d90bbb`, identified by the
conversational handoff committed at `4aadfc5d5b7604136b3123232a6103f50395ec00`.
OpenAPI, SSE schemas/examples and manifest were exported from that immutable revision and
compared byte-for-byte with the previous `94408ab4b59297e93e2574320b3049ee2f5d4f2e` pin;
all are unchanged. Regenerated HTTP types also have no diff. Source metadata records the
API/handoff commits and artifact hashes; parser/transport tests consume the real examples.

The server now supplies bounded same-conversation context. The frontend continues sending
only the current question and locale to the existing conversation ID, never a copy of history.
There is no new action/HTML payload. Fifteen-second silent-stream heartbeat comments are
ignored by the existing parser; the reviewed proxy body limit is 32 KiB. The API image now
includes pinned Git for its public-source indexing CLI, replacing our test-only wrapper.
No mutable API files or paid provider calls were used.

Existing paths, headers, session/CSRF and seven event names remain compatible. New abuse
limits use existing public errors. `message.completed` is durable output; disconnect
can omit the terminal frame. Preserve partial content and recover without regeneration.

## Refresh procedure

1. Obtain the API owner's committed handoff with exact SHA, OpenAPI, SSE schemas/examples
   and compatibility notes. Do not copy artifacts from a mutable checkout.
2. Export artifacts from that SHA into `contracts/`; update both SHA-256 hashes and
   `api_commit` in `source.json`. Review endpoint, cookie, CSRF and event changes.
3. Run `npm run contract:generate`; review the generated diff and update runtime parsers
   and mapper deliberately. Generated types do not validate untrusted JSON.
4. Run contract/unit/browser checks and update the deterministic fixture examples.
5. Update the separately pinned live-fixture CI checkout and run that integration gate.
   Hash checks verify local snapshot integrity; provenance comparison requires the
   committed upstream artifacts, not merely recalculating hashes after an edit.

## Application deployment handoff

The [frontend image/operation contract](deployment-contract.md) and [ADR](adrs/002-shared-vps.md)
are ready for the vps-ops-owned Coolify production composition. Preserve `/api/*`, empty root_path,
relative browser URLs, host-only secure cookies and exact credentialed origin allowlists.
Consume this frontend's merged commit and the manual release's immutable image digest;
never use the mutable task branch as a release dependency. Production publication/deployment
remains separate from this implementation.

## Portfolio integration handoff

The initial design inspection at `45d8a42faa78bfb94952639ed462832c3b4ad109` predated the
integration. The newer committed revision `e411c0a775b16fd7de962774d875e47191f96b09` contains
`src/components/assistant/assistant-panel.tsx`, `client.ts` and `assistant-launcher.tsx`.
It has a native panel calling the API directly plus a standalone link; it is not an iframe.
No redesign or portfolio edit is necessary here. At its separately approved build, set
`NEXT_PUBLIC_ASSISTANT_API_URL` and `NEXT_PUBLIC_ASSISTANT_WEB_URL` to
`https://assistant.gonzalomartinperez.com` (the URL is read by the panel).
Allow the exact `https://gonzalomartinperez.com` origin on the API with credentials and
current bootstrap/CSRF requirements; preserve host-only cookies, no Domain sharing.
The local proxy smoke tests this CORS/Origin contract; the actual deployed panel still
needs HTTPS/browser verification. Test both languages, session restoration, stop, sources,
keyboard focus and navigation from the portfolio. Do not add framing permissions.
