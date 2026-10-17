# Feedback and reviewed improvement

The authenticated overview can show current helpful/not-helpful ratings from the
API's existing owned feedback capability. It never requests questions, answers,
message IDs, user identities or a conversation export. Live membership is checked
before any server-only service read. The service token stays on the server.

`FEEDBACK_OVERVIEW_ENABLED=false` is a runtime flag, independent of product analytics.
Off performs no request. Missing configuration, an unavailable API, an unexpected
schema or an oversized response shows unavailable, never fabricated zero counts.
The isolated browser fixture enables it explicitly and labels all metrics synthetic.
No public collection or production activation follows from this implementation.

## Meaning and contract

The separately pinned `contracts/feedback.source.json` identifies API
`bb36012eef55e85f7e0cf78df1845f38ef13da63` and the SHA256 of
`feedback.schema.json`. The private bearer-protected endpoint is
`GET /internal/ops/v1/feedback`; it is not browser-accessible or part of public OpenAPI.
Runtime validation precedes mapping into the pure operations model. Reads use an exact
configured private origin, no redirects/cache/browser credentials, a five-second
abort and a 4096-byte actual-body bound with strict UTF-8 and reader cleanup.

Counts represent **current votes on retained assistant answers created in the last
seven days**. The legacy rating table has no vote timestamp: this is not a timeline
of when people voted. Repeated votes replace the current choice; owned deletion and
retention cleanup reduce totals. Helpful share is calculated among current ratings;
no ratings is a separate empty state, not a zero-percent verdict. These are opinions,
not verified answer accuracy, unique visitors or a reliable generation ledger.

## Human-controlled learning loop

Use aggregate availability/cost/latency and voluntary feedback to choose a topic for
human investigation. A reviewer writes a synthetic or adequately anonymized regression
case, changes the relevant source or behavior in a normal PR, and runs contract,
security, unit and authorized evaluation checks. Improvement is released only through
reviewed source changes. There is no automatic training, corpus mutation, raw-chat
review page, export, or new data capture in this backoffice. A new review workflow
would require a separate privacy and authorization design.

The API also minimizes common visitor email, international-phone and secret patterns
before retrieval/provider context. This is best-effort, not comprehensive PII detection;
original private history retains its documented lifecycle. Authoritative public evidence
is not redacted. See the API's committed
[privacy and feedback behavior](https://github.com/gonzalomartinperez/portfolio-assistant-api/blob/bb36012eef55e85f7e0cf78df1845f38ef13da63/docs/feedback-and-improvement.md).

## Verification

`npm test` covers closed schemas, invalid timestamps/counters, disabled/no-network,
private path/token handling, bounded failure, split UTF-8 and reader cancellation.
The managed three-engine browser matrix checks aggregate labels and share, EN/ES,
keyboard preferences, mobile overflow, reduced motion and safe unavailable states.
API CI39061876817 separately passed461 offline and31 real-service tests, including
rating replacement/deletion against PostgreSQL. Browser fixtures are not evidence
of deployed API pairing, OAuth providers, live model compliance or physical devices.
