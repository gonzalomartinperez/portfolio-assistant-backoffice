# Private product-interaction view

The `/analytics` page rechecks live owner/viewer membership before fetching data.
It consumes API commit `59a5ccec1b38bb1a3679497deffd02749c0e8d49`, copied from
committed Git objects, not an API working tree. Schema/hash/provenance are in
`contracts/product-analytics.source.json`; the generated OpenAPI wrapper and types
are drift-checked in CI. Existing operations v1 remains unchanged and best effort.

`PRODUCT_ANALYTICS_ENABLED=false` is the server-runtime default. Off means no
product request, not a fabricated empty dataset. When true, the existing private
`OPERATIONS_API_ORIGIN` and `OPERATIONS_READ_TOKEN` read exactly
`/internal/ops/v1/product-analytics`. No new secret, port or storage is required.
No public collection is enabled by this page or flag; the API and public portfolio
have independent activation gates. Never use NEXT_PUBLIC for this configuration.

The read adapter has a five-second deadline, 256,000-byte actual response limit,
no redirects/cache/cookies, strict UTF-8 and a closed runtime parser. Only validated
allowlisted counts reach the client. Unknown fields/projects/countries, duplicate
cells, invalid dates/counts and event/target mismatches fail closed. Service tokens,
event IDs, prompts and session credentials never enter props or browser JSON.

## Meaning and interaction

Accepted interactions are not unique people, completed downloads, sent contacts or
provider invoices. The source groups by authoritative server UTC day, covering the
current day plus six preceding days. Country is `unknown`; no country inference or
visitor journey is shown. Transport loss, bots and global quotas affect coverage.
No historical generation count is inferred from website events or SSE chunks.

Choose an event using the native keyboard-accessible select. Static token-colored
bars supplement a captioned semantic table; no chart animation or tooltip is
required to read the counts. Native disclosure provides section/language details.
No records, disabled configuration and unavailable source have different messages.
Both English/Spanish and existing data-theme tokens apply. Mobile bars reflow;
there is no fixed-height reading region or scroll interception.

The production-build browser harness uses real isolated IAM PostgreSQL with signed
synthetic sessions and a separate authenticated fixture endpoint. Sample values
are clearly labeled. It is not a live API/OAuth/production acceptance test. CI
retains only synthetic PNG screenshots for seven days, never cookie/session files,
traces or raw request logs. Manual physical-device/screen-reader review remains a
separate limitation; axe is not an accessibility certification.

## Refresh procedure and activation boundaries

1. Obtain an identified committed API revision and review its compatibility notes.
2. Copy `product-analytics.schema.json` using `git show <sha>:contracts/...`; record
   its SHA256 and exact source SHA in the provenance file.
3. Regenerate the local OpenAPI wrapper from `$defs` plus `ProductSnapshot`, rewriting
   refs only in the wrapper. `npm run contract:check` verifies this transformation.
4. `npm run contract:generate`, typecheck, unit tests and authenticated browser
   checks verify the consumer. Do not silently repin the historical chat snapshot.
5. Agree effective private routing, reviewed retention/backup expiry, privacy basis,
   accurate public notice and storage/resource acceptance before any activation.

API local limits are 24-hour event dedupe and seven UTC-day aggregates; these are
not a production retention approval. Expiry is logical until maintenance/pruning;
backup erasure and restore are ops gates. Migration 007 belongs to the API repository.
This backoffice slice requires no IAM migration. After API migration 007, a pre-007
API image fails schema readiness because its checkout lacks the applied migration.
Use a reviewed forward-fix image retaining 007/checksum with analytics off; never
delete the migration, weaken the guard or restore over newer writes. Image rollback
does not roll back API migrations or erase analytics data. Publication/deployment stay disabled.
