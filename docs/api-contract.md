# API contract ownership and refresh

Private operations v1 is pinned to API commit
`d30d36857c9053693c7817d967a7b38b97d9f12a`. The original schema and example are
imported from committed Git objects, with SHA256 provenance in
`contracts/operations.source.json`. The owned minimal OpenAPI wrapper references
that schema; `operations.types.d.ts` is generated with the existing frozen toolchain.
The bounded adapter maps this wire schema to independent domain models and rejects
unknown fields, inconsistent totals, more than 100 traces or 16 phases per trace.

Local unit tests execute the committed API example through the actual runtime mapper.
Browser tests use deterministic fixtures and real PostgreSQL authentication. Earlier
[API-side adapter verification](https://github.com/gonzalomartinperez/portfolio-assistant-api/blob/30f2d565ce38d15f5a6e69c2323c0f3e358b3eed/docs/verification/private-observability-2026-10-12.md)
exercised real HTTP at API `5ff96d3dbd015ddf9f90f83231052f57b7d494c8` with
backoffice `618aa914ced48bf08ba8d613537ecd28ef797d5e`. It is historical adapter
evidence, not acceptance of the current dashboard over deployed OAuth/HTTPS.

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
install/regenerate/check the historical public archive and the pinned private operations
snapshot plus the separately pinned product and feedback schemas. CI checks drift in all four generated declaration files. Public and private contract
provenance remain separate.

## Independent feedback contract

`contracts/feedback.source.json` pins the committed API schema and hash independently
of operational status and product counts. The minimal owned OpenAPI wrapper is checked
against that schema, then the frozen generator emits `feedback.types.d.ts`. No public
paths are invented by the wrapper. See [feedback semantics](feedback-and-improvement.md).
