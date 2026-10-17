# Security

Report vulnerabilities privately to [gonzalomartinperez2002@gmail.com](mailto:gonzalomartinperez2002@gmail.com),
the owner's public contact address verified in the portfolio's `src/content/site-config.ts`
at `45d8a42faa78bfb94952639ed462832c3b4ad109`. Use the subject
“portfolio-assistant-backoffice security report”. GitHub private vulnerability reporting was
not enabled when this policy was written; this policy does not imply that it is available.

Include affected commit/browser, impact and minimal reproduction using fixture data.
Do not send real credentials, private documents or personal conversation transcripts.
Do not publish exploit details in an issue before the maintainer has reviewed the report.
There is no promised response SLA or bounty program.

The current `develop` revision is the active review target; this project has not declared
a production support window. Browser validation is not server authorization. Session,
CSRF, retention and provider security also depend on the separately maintained API.

This repository implements the authenticated operations backoffice. The native visitor
conversation UI belongs to the separately maintained portfolio. Protected pages, actions
and APIs verify live owner/invited-viewer membership; mutations recheck owner membership
transactionally. Private operations credentials remain server-only, requests use
`cache: "no-store"`, and runtime validation rejects sensitive or unexpected payload fields.
No prompts, answers, provider keys, private documents or raw service errors belong in the
dashboard. No analytics or session replay is included. Live OAuth, HTTPS, session-cookie,
CSRF/origin and private-proxy settings need independent production verification.

CI runs redacted high-confidence current-file/reachable-history scans and dependency-boundary tests. Review
runtime dependency changes and lockfile diffs; Dependabot proposes updates to `develop`.
These checks supplement review and do not constitute a comprehensive security audit.
