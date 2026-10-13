# Operations dashboard research · 2026-10-12

The owner supplied three visual references: Corelytics dark analytics, Vision UI
React dashboard and a black/green bento layout. They informed grouping, compact
indicators and general-to-specific reading order. Their unknown-license images/code
are not copied or published. Original implementation retains portfolio Inter typography,
cyan identity, semantic light/dark tokens and owned primitives. No sidebar is added
without real destinations; no decorative historical chart substitutes for missing data.

## Adopted principles

- [Grafana dashboard guidance](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/best-practices/)
  supports focused questions, meaningful colors, hierarchy and restrained refreshes.
  The workbench moves from availability/freshness/outcomes to sampled execution detail,
  with explicit manual refresh. It does not fabricate RED rates or infrastructure USE metrics.
- [Prometheus instrumentation](https://prometheus.io/docs/practices/instrumentation/)
  informs separating measurement semantics from presentation. API-provided 30-day totals
  are not requests per second; the durable UTC-month ledger remains the budget authority.
- [OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/observability-primer/)
  distinguish execution context from aggregate metrics. Opaque sampled traces expose
  allowlisted phase durations without questions, answers or arbitrary attributes.
- [Owned shadcn chart patterns](https://ui.shadcn.com/docs/components/base/chart)
  favor the existing Recharts foundation and accessibility layer. No second chart library,
  component catalog or animation engine is installed; native tables remain available.

## Integration limits

The custom workbench consumes the pinned private JSON summary server-side. vps-ops
owns authenticated Grafana, Prometheus and collector deployment. A runtime-configured,
validated dashboard link is optional; it neither embeds Grafana nor proves connectivity.
Historical trends, uptime percentages, CPU/disk measurements and field responsiveness
need additive committed contracts and operational evidence before they appear here.
