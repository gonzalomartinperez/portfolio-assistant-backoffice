# API contract ownership and refresh

No operational API contract has been consumed. The inspected backend revision is
`c6012067c4a99db477bb6ddcf1f26dae095641ca`. The bounded private status adapter currently
follows a [proposed request](backend-operations-request.md), verified with deterministic
fixtures. Do not claim live telemetry or compatibility from those tests.

The public HTTP/SSE contract and conversation mapping now belong to the portfolio's native
assistant, committed at `7753d39`. That implementation consumes the committed c6012067
handoff and runs real transport/SSE boundary tests. This repository no longer parses SSE
or exposes a public chat/embed route.

`contracts/` retains the former public snapshot as historical migration provenance:
API `6b1e65f2406ba5ddf21d15c56c34ccf672d90bbb`, handoff
`4aadfc5d5b7604136b3123232a6103f50395ec00`. Hash checks and reproducible type generation
verify that archive only; it does not establish private operations compatibility.
The separately locked generator uses the compiler API it supports, not the primary checker.
See [TypeScript compatibility](adrs/003-typescript7-compatibility.md).

## Consuming the private handoff

1. Obtain the API owner's committed SHA, schema, examples and compatibility notes. Do not
   copy a mutable checkout or promote the proposed endpoint to an implemented guarantee.
2. Import only the operational artifacts with explicit provenance. Update the owned hash
   checker and generator target for that actual schema; private reads do not need invented SSE.
3. Regenerate types, review the diff and update bounded runtime validation/mapping separately.
   Generated TypeScript does not validate JSON or remove secrets.
4. Verify authenticated reads, failures, unknown fields, sizes, timeout/cancellation and
   a real isolated backend. Keep fixture and integration evidence distinct.
5. Record consumed/tested revisions in the runtime contract and release metadata. Until
   that evidence exists, operational compatibility remains unverified and deployment disabled.

`npm run contract:install`, `npm run contract:generate` and `npm run contract:check`
currently install/regenerate/check only the identified historical public archive.
