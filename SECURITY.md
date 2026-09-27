# Security

Report vulnerabilities privately to [gonzalomartinperez2002@gmail.com](mailto:gonzalomartinperez2002@gmail.com),
the owner's public contact address verified in the portfolio's `src/content/site-config.ts`
at `45d8a42faa78bfb94952639ed462832c3b4ad109`. Use the subject
“portfolio-assistant-web security report”. GitHub private vulnerability reporting was
not enabled when this policy was written; this policy does not imply that it is available.

Include affected commit/browser, impact and minimal reproduction using fixture data.
Do not send real credentials, private documents or personal conversation transcripts.
Do not publish exploit details in an issue before the maintainer has reviewed the report.
There is no promised response SLA or bounty program.

The current `develop` revision is the active review target; this project has not declared
a production support window. Browser validation is not server authorization. Session,
CSRF, retention and provider security also depend on the separately maintained API.

The frontend uses credentialed requests with `cache: "no-store"`, a memory-only CSRF token,
validated JSON/SSE, sanitized Markdown, HTTPS-only output links and no remote model images
or raw HTML. Only theme and locale preferences are persisted locally. Provider/admin keys,
private documents and raw backend errors do not belong in this repository or its client.
No analytics or session replay is included. Production must configure HTTPS, cookie policy,
CORS and the public API origin; local fixtures do not certify those deployment settings.

CI runs a redacted high-confidence public-file scan and dependency-boundary tests. Review
runtime dependency changes and lockfile diffs; Dependabot proposes updates to `develop`.
These checks supplement review and do not constitute a comprehensive security audit.
