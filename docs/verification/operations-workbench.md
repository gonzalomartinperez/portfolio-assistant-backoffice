# Operations workbench acceptance · 2026-10-12

The workbench implements the owner-supplied visual direction using existing portfolio
tokens and Recharts. No additional dependency or monitoring service is installed.
WSL Linux, Node 24.21.0, Next 16.3.8, React 19.3.0, TypeScript 7.0.2 and
Playwright 1.63.0 are the local environment. PostgreSQL fixture sessions use an
owned disposable tmpfs database on loopback 15439, separate from other agents.

## Acceptance criteria

| Area | Required evidence |
| --- | --- |
| Measurements | API/store readiness is distinct from OpenAI; 30-day execution windows, UTC-month ledger estimates and sampled traces are labeled. |
| Budget | Settlement/reservations separate; zero budgets have no invented percentage, overspend remains visible and a native meter matches the ring. |
| Interaction | Keyboard chart/table switching, combined outcome/ID filters, no-match recovery and Escape preference focus restoration. |
| Layout | 320px, landscape, tablet, desktop, 200% text; no horizontal clipping. Both themes/locales and reduced motion. |
| Privacy | Live membership guards; validated allowlisted props; no service tokens, transcripts or provider keys in browser data. |
| Integration | Committed API schema/example pin, generated declarations and runtime example mapping; deployed OAuth/API pairing reported separately. |
| Runtime | Production standalone build plus the exact-image migration/browser/resource/security checks in Actions. |

Initial browser verification found wrapped-label exact matching and text-resize overflow.
The controls now use separate explicit labels; header, refresh and filters reflow at
large text sizes. Those failures were fixed rather than relaxing assertions or timeouts.

## Evidence boundaries

Screenshots in [the gallery](readme-gallery.md) use explicitly synthetic operational
values and real isolated PostgreSQL-backed signed authentication. No real OAuth
provider, paid model, production Grafana datasource or VPS deployment is exercised.
Grafana is an optional validated navigation destination with independent authorization;
its presence never asserts that monitoring is online.

The reference build at `618aa914ced48bf08ba8d613537ecd28ef797d5e` emitted
27 JavaScript assets totaling 1,356,230 bytes in the same environment. Emitted-byte
comparisons measure build output, not route-specific transfer or field responsiveness.
The first workbench build emitted 1,363,015 bytes (+6,785, approximately 0.50%).
Webpack compilation of the reviewed build took 33.8s and its framework type phase 8.3s;
concurrent local workloads prevent a controlled total-build speed comparison.

Physical-device gestures/keyboard, human screen-reader review, live provider callbacks,
deployed API pairing, production data collection and actual VPS capacity remain unverified.
