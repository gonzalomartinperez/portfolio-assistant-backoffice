# Implementation status · 2026-10-17

This repository is now the authenticated portfolio-backoffice. The native
public conversation belongs to the portfolio; historical chat artifacts remain identified
as migration evidence. Current architecture, setup and galleries are in [README](README.md).

Implemented: verified owner/invited viewer admission, Google/GitHub account linking,
revocation, private status validation, a responsive bilingual/light-dark operations
workbench, accessible snapshot charts, trace filtering and monthly budget estimates.
The private schema/example are pinned to API `d30d36857c9053693c7817d967a7b38b97d9f12a`;
synthetic browser tests do not establish deployed API/OAuth acceptance. Website
interaction counts have a separate pinned contract and default-off flag; see
[product analytics](docs/product-analytics.md) and [project scope](docs/adrs/006-project-backoffice.md).

CI uses strict TypeScript 7, enforced boundaries, frozen installs, one verified non-root
production image and Chromium/Firefox/WebKit checks. The four canonical repository skills
share discovery sources. vps-ops owns Coolify, monitoring and all production execution.
No image publication, deployment or portfolio assistant activation is enabled.

See [workbench evidence](docs/verification/operations-workbench.md),
[container evidence](docs/verification/container-readiness.md),
[API provenance](docs/api-contract.md) and [release checklist](docs/release-checklist.md).
Real provider callbacks, deployed pairing, physical devices, screen readers, resource
capacity and backup/restore remain separate acceptance gates. Source promotion requires
explicit owner authority and current-head CI; it does not authorize deployment.
