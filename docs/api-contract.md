# Pinned API contract and refresh

Current API revision: `94408ab4b59297e93e2574320b3049ee2f5d4f2e`, identified by the
API owner's handoff commit `1c0db93`. OpenAPI is byte-for-byte unchanged; the SSE snapshot
now has discriminated payloads and committed success/failure/cancellation examples.
`contracts/source.json` records artifact hashes; generated HTTP types remain unchanged.
Examples are tested through the actual parser/transport mapper. No mutable API files
were consumed. The prior verified pin was `492e976f58a5febbb5f51d7588b501fe36f161d2`.

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

## API-owner deployment handoff

The [frontend image/operation contract](deployment.md) and [ADR](adrs/002-shared-vps.md)
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
