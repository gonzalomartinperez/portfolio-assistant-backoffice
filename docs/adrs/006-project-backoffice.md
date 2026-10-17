# ADR 006: one portfolio backoffice, separate project features

Accepted scope 2026-10-17. This supersedes the assistant-only product naming in
ADR004, while preserving native public chat ownership and private authorization.

The canonical public repository is `gonzalomartinperez/portfolio-backoffice`, renamed
in place from `portfolio-assistant-backoffice`. GitHub ID1389594043 and node ID
`R_kgDOUtOFuw` are unchanged. Public visibility, default main, history, PRs and the
strict required checks/administrator protection were verified after renaming.
Existing local worktree directory names need not match the canonical repository.
No registry image, database, network, cookie, domain or persistent volume is renamed
by this source/repository change; there is no production deployment.

The homepage composes a website-interaction summary and the existing assistant-health
workbench. `/analytics` owns reviewed site-event detail; access management remains a
separate protected responsibility. The assistant is a bounded operational feature,
not the entire project and not another public chat. No CRM, commerce/purchase metrics,
visitor journey tracking, arbitrary database access or infrastructure control is added.
Both source adapters remain server-only and independently represent unavailable/off
states. Live owner/viewer membership is checked before either read; independent reads
run concurrently. Public collection remains default-off under separate owner approval.

Feature organization is intentional: domain is pure, application owns narrow ports,
adapters validate/map wire data, presentation renders semantic controls and entry/page
composition injects concrete capabilities. New analytics follows this existing pattern;
React server composition passes its summary as a presentation slot rather than coupling
assistant models to product-event transport. Existing AST/cycle/client-server negative
checks apply to every feature. No shared DI framework, parser or empty layer is added.

Compatibility exceptions: API/SSE and private-operations contract versions and source
SHAs retain their historical identities. The health response application identifier,
Better Auth internal app name, `backoffice` cookie prefix, IAM tables and configuration
names remain unchanged. These are existing runtime contracts, not naming mistakes to
mass-replace. Actual image publication/private package visibility remain unconfigured;
future image naming is an ops handoff, not an existing retrievable artifact.

Historical screenshots/reports and ADR004 keep their original identity/revision context.
Active package metadata, source labels, dependency-policy repository checks, README and
handoff use the canonical new repository. GitHub redirects are convenience, not a reason
to use old names in new automation or recreate a repository at an old name.
