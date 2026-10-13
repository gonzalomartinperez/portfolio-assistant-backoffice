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
The final local production image emitted 1,363,164 bytes (+6,934, about 0.51%);
individually gzipped assets totaled 416,688 versus 414,135 bytes (+2,553, about 0.62%).
No dependency was added. These are all emitted assets, not per-route transfer measurements.
Webpack compilation of the reviewed host build took 33.8s and its framework type phase 8.3s;
concurrent local workloads prevent a controlled total-build speed comparison.

Physical-device gestures/keyboard, human screen-reader review, live provider callbacks,
deployed API pairing, production data collection and actual VPS capacity remain unverified.

## Executed checks

- Frozen npm install and isolated contract generation; strict TypeScript 7, Biome,
  public-file scan, documentation links and all four canonical skills passed.
- 55 unit tests passed in 20.79s, including contract example mapping, budget/selection
  modeling, architecture and the four parallel-prerequisite exit combinations.
- Two real PostgreSQL/auth integration tests passed in 14.48s. The safety guard
  rejects remote/malformed fixture URLs before importing database/auth libraries.
- [Actions 38323223253](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/actions/runs/38323223253)
  passed static/image/browser jobs for feature source `4ebfcaa8324028107eb432a27e86745d7737f78b`.
  Later documentation/runner changes require their own current-head checks.

Local Buildx 0.38.0 was downloaded into ignored project tooling, verified against
the upstream release SHA256 and used without a global installation. The default
legacy builder correctly rejected BuildKit mounts; documentation now requires Buildx.
A build of an intermediate context was cancelled after removing publication-only files
from the runtime; the final application image built successfully.

Local image ID `sha256:ae80128c093725d3c4f2a05537076294bbf2e9de07ad110a0af88569b011c1b1`
is an engine artifact, not a published registry digest. It passed exact-image migration,
readiness/health, filesystem/compiler isolation and bounded anonymous workload checks:
302 MB reported disk, 72,715,386 inspect bytes; 57.73 MiB idle / 77.18 MiB after workload;
11 PIDs; 64 anonymous requests with concurrency 8 in 4,942ms (p50 454ms, p95 2,532ms).
The 512 MiB / 0.75 CPU profile ran under concurrent WSL workloads. These observations
do not measure authenticated chart interaction, peak memory or VPS capacity.

## Final workbench CI and local limitations

PR #44 integrated at `4b545c82c1ffbc2753c16d15d2525cec49b5d891` after
[38324631699](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/actions/runs/38324631699)
passed the complete current-head gate. Static/image/browser/gate took 25/63/159/7s.
Mobile a11y now covers EN/ES × dark/light as separate cases, with unchanged WCAG tags
and 30s limits; the managed available/unavailable lifecycles cover 45 cross-engine cases.

Local exact-image failure-mode tests passed 3/3 in 23.4s. The available-mode local
run passed 28/33; five cases timed out under WSL load around 29–36. A one-worker
retry passed three of those five; Firefox's compound accessibility case and WebKit's
availability expectation still timed out. These failures are retained as limitations,
not mislabeled as passes. Current CI passed the complete matrix on dedicated runners.
The compound accessibility test was split by locale/theme, expanding English coverage
and preserving every assertion; no global timeouts or transport deadlines were increased.
Physical-device and VPS acceptance remain open, especially under contention.

## WebKit zoom correction and source promotion

Increasing trace input/select text to 1rem exposed WebKit native select paint overflow
at 200% text. Runs 38327115944 and 38328663004 correctly failed the gate. Inspection
of the actual CI image showed a 244px measured selector with 348px parent scroll
overflow; intrinsic track constraints alone did not solve it. A scoped field paint clip
with 6px margin retains the focus ring/offset. The native choice popup remains native.
A local CSS probe confirmed 390px document width, retained focus and ArrowDown selection;
that diagnostic is separate from production-image acceptance.

Final source `408ceb959cedbbe19580e7e2b6850e89bfd86cfe` passed
[38330973883](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/actions/runs/38330973883),
including all 45 browser cases and WebKit 200% text. No timeout, clipping assertion,
WCAG tag or browser engine was removed. Main promotion PR #46 passed
[38331520843](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/actions/runs/38331520843)
and merged at `c52c13a647b04d15c11d8eace46753e3ae3b8685`. Real OAuth, production
monitoring/API pairing, screen readers, physical phones and VPS capacity remain open.
