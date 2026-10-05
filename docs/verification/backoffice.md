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
- The image above is historical local evidence; the final source/image was revalidated in Actions as recorded below.
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

## Final integration evidence

Backoffice source `8e1fc8f52474b05bf7abb011d519399020bfb615` passed
[Actions run37247552502](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/actions/runs/37247552502)
and merged through PR28 into develop as `51f638487cbcb3cedc0bff1678a25892f9099063`.
Jobs: static26s, image174s, browser/auth148s, required gate4s. The browser job loaded the
exact exported non-root image, migrated its isolated PostgreSQL schema and verified OAuth
fixture/invitation/revocation plus available/unavailable states in all three engines.
No registry publication or production deployment was performed.

The public replacement merged through portfolio PR94 as
`83a4ecde0591da9c35c939a8c6b82dc9b010fdc6`, after
[Actions run37248316043](https://github.com/gonzalomartinperez/portfolio/actions/runs/37248316043)
passed 388 browser checks with eight explicit capability skips, without failures/flaky
results. All eight shards reused one verified build; job durations ranged318–710s.
These recorded timings are local/CI evidence, not field performance or promised speedups.
