# Operational contract request · version 1

Status: **proposed, not a consumed or implemented API capability**. API inspected at
`c6012067c4a99db477bb6ddcf1f26dae095641ca`; public chat contract remains separately pinned.
The API currently rejects OpenTelemetry configuration and has no operational HTTP routes.
Its owner must approve and publish this additive contract before real dashboard integration.

The browser-facing chat is moving into the portfolio. This repository owns an authenticated
backoffice. Suggested private endpoint: `GET /internal/ops/v1/status`. The public proxy must
never route `/internal/`; authenticate a server-only read credential as defense in depth.
No user-management or generation privileges belong to this credential.

The proposed payload and runtime mapper are maintained in
[validator](../src/features/operations/adapters/validate.ts) and
[synthetic example](../tests/fixtures/operations.ts). Required envelope:
`schema_version: 1`, `observed_at`, `api_commit`, `availability`, `knowledge`, `executions`,
`usage`, `traces`. Every object rejects unknown keys. Traces are bounded to 100, stages to
32, and the HTTP response to 256,000 bytes. No credentials, transcripts, prompts, document
excerpts, personal data, cookies, session identifiers or arbitrary exception messages.

Knowledge includes state, public source commit, corpus version and last successful indexing
timestamp. Executions include total, completed/cancelled/failed and nullable first-token p50/p95.
Usage separates settled estimates from reservations and records the pricing revision; it is
not the provider invoice. Traces contain an opaque 32-hex trace ID, timestamp, terminal outcome,
duration and allowlisted phase durations only. No record implies unsampled requests did not occur.

## Instrumentation request

Replace the blanket no-OTel validator with opt-in, private OTLP export. Keep LangSmith and
third-party analytics disabled. Instrument application boundaries through a small observer
port, with concrete OpenTelemetry in adapters/composition; do not import its SDK into domain.
Allowlisted phases: language, vector_retrieval, graph_retrieval, generation, finalization.
Metrics cover all executions; traces sample 100% fixtures / proposed 10% production. No raw
LangGraph state, callback inputs/outputs or exception content. Export failure must not delay
generation, cancellation or shutdown. Bound queues and flush deadlines.

Collector/Prometheus/Tempo production services, retention and capacity belong to vps-ops.
Proposed retention is 30 days metrics / 7 days traces, subject to measured disk/resource budget.
The API owner supplies a committed schema, examples, compatibility notes and regression evidence.
Until then the backoffice returns unconfigured/unavailable states; synthetic tests are labeled.

## Required acceptance

Prove private routes are not publicly proxied, read credentials cannot mutate state, and seeded
secret/content canaries never reach exports. Test generation success/cancel/error/EOF, observer
failure, bounded buffers, fresh/stale knowledge and reconciliation with the spend ledger.
Real OpenAI evaluation remains separately authorized; no telemetry test needs a paid model call.

## Prometheus and Grafana handoff

Use Prometheus for aggregated execution outcomes, first-token/request duration histograms
and cancellation counters. Labels must be bounded enums (for example outcome or phase),
never emails, conversation/trace IDs, prompts, URLs or document contents. Metrics are not
the accounting authority: the durable backend spend ledger supplies settled estimates,
reservations and budget reconciliation even after process restarts or scrape gaps.

vps-ops owns private collection, authenticated Grafana access, datasource restrictions,
retention, dashboards and alert delivery. No anonymous/external dashboard sharing or
Grafana iframe is required. The backoffice reads the validated private API summary;
it receives neither datasource credentials nor arbitrary PromQL access. Grafana viewers
may query beyond visible panels, so dashboard visibility alone is not access isolation.
The API owner defines the committed exporter/observer contract before any live claim.

References: [Prometheus naming and cardinality](https://prometheus.io/docs/practices/naming/)
and [Grafana security](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/).
These are preparation requirements, not authorization to install shared services.
