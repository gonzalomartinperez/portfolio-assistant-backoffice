# Backoffice verification

Local environment: WSL Linux, Node 24.21.0, TypeScript 7.0.2, Next.js 16.3.6,
PostgreSQL 17 and Playwright 1.63.0. Browsers ran against the production container,
not the development server. Operational data and OAuth providers are deterministic
fixtures; PostgreSQL and signed session admission are real.

- 40 retained unit/contract/tooling tests passed. Public-chat tests moved to the portfolio
  after 31 native unit/network checks and 68 browser checks passed; legacy chat was retired.
- Strict typing, lint, documentation links, public-file scan and four skill entries passed.
- Production image sha256:abc01af176d17ce509067ca1ba086b3849662dd0b2dd5a3a6459e4b6aae5c18e
  built successfully: 194,338,842 bytes uncompressed, runtime user node.
- The image executed IAM migration successfully with a read-only filesystem and dropped capabilities.
- 21 browser checks passed across Chromium, Firefox and WebKit in 1.2 minutes.
- Three operational-unavailability checks passed across those engines in 11.7 seconds.
- Later readiness-table and fixture-startup changes require final image revalidation.
- The managed local lifecycle was exercised against a newly created isolated database:
  migration, signed-session provisioning and readiness passed; SIGINT removed the private
  session artifact. Only that disposable database was dropped afterward.

The backoffice pipeline passed for revision `6874d1e88fc00008ee2d2a0828d1fdaae456fba0`
in [Actions run 37244209786](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/actions/runs/37244209786).
Measured job durations: static 25s, immutable image 53s, browser/authentication 129s,
required aggregator 4s. Static and image run independently; browser tests reuse that
image without rebuilding. This verifies the current job graph, not field performance.
Subsequent product changes require checks on their own head revision before merging.

![English operational dashboard in the dark theme, with explicitly synthetic metrics](backoffice/desktop-dark-en.png)

![Spanish operational dashboard at a narrow mobile viewport in the light theme](backoffice/mobile-light-es.png)

Both screenshots show test fixtures, not implemented production telemetry. Keyboard
checks cover owner/viewer navigation, Escape dismissal and focus restoration. Automated
accessibility checks and desktop viewport emulation do not prove screen-reader or
physical-phone behavior. Real Google/GitHub registrations, production operations API,
effective Coolify/proxy headers, deployment and paid model behavior are unverified.

Dependency maintenance was verified separately in GitHub Actions run
[37241921635](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/actions/runs/37241921635).
Its complete pre-migration pipeline passed in approximately four minutes; this is not
a timing measurement for the new backoffice pipeline. Dependabot PRs26 and27 merged
through required checks into develop. No production deployment followed.

## Interactive chart increment

Recharts 3.10.1 and React-is 19.3.0 were installed with exact versions and no peer overrides.
The dashboard visualizes validated snapshot outcome/token totals; it does not imply
historical trends. Charts use semantic colors, no bar animation and a permanent data table.
Local production compilation passed (17.8s compile phase, single run, not a speed claim).
All 21 available-mode browser checks passed in 32.4s with two workers, followed by three
unavailable-mode checks in 8.7s. Six focused chart/mobile checks also passed in 21.9s:
metric switching and keyboard tooltips in all engines, dark/light Spanish mobile axe and
no overflow. The images above were refreshed from this run and inspected. npm audit
reported zero findings. An initial selector-label failure was corrected and reverified.
These are synthetic operations and real local PostgreSQL/session checks, not live
provider/telemetry verification. Final immutable-image checks run on the PR's current head.
