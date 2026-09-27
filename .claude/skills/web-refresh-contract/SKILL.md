---
name: web-refresh-contract
description: "Import an identified committed API handoff and verify frontend HTTP/SSE compatibility, runtime mapping and provenance. Not for designing API endpoints or editing the backend."
---

Read the [operating contract](../../../AGENTS.md) and [contract procedure](../../../docs/api-contract.md).
Require an immutable API commit and its committed handoff, OpenAPI, discriminated SSE schema,
examples and compatibility notes. Missing SHA or a mutable sibling checkout is a stopping
condition for import, not permission to invent event names. Continue on the current pin
with fixtures and write a precise backend request if the handoff is incomplete.

1. Inspect [source metadata](../../../contracts/source.json), generated types and existing
   [adapter](../../../src/features/assistant/adapters/api.ts)/[parser](../../../src/features/assistant/adapters/sse.ts).
   Fetch the identified public revision into an isolated checkout only when network access
   is authorized. Preserve dirty work. Do not change the API repository or any shared service.
2. Compare endpoint paths, exact origin/session/bootstrap/CSRF requirements, cancellation,
   message persistence and event ordering. Relative /api/v1 paths must survive the shared
   proxy unchanged. Successful run completion still requires durable message completion.
3. Import the committed artifacts, update provenance and all applicable hashes, and run
   `npm run contract:generate` and `npm run contract:check`. Never hand-edit generated types
   or merely recompute hashes to disguise unexplained drift. Types do not validate JSON.
4. Update runtime mapping/validation and deterministic examples deliberately. Run `npm test`
   and the relevant browser flows. Review pinned references in
   [integration preparation](../../../scripts/prepare-integration.sh) and the test Compose
   specification when upgrading the live compatibility gate; avoid a mixed-revision stack.
5. With Docker/ports available and isolated fixture execution authorized, follow the live
   commands in [deployment verification](../../../docs/deployment.md). Those commands create
   test-only databases; never point them at shared/production data, use paid providers or
   remove volumes. Report unavailable prerequisites rather than substituting real credentials.

Return the exact consumed SHA, artifact/type diff, wire compatibility decisions, actual mock
versus live results and any remaining backend/portfolio handoff. A review-only invocation
performs comparison and reports findings without importing, committing or opening a PR.
