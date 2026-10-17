# Clean Architecture increment · 2026-10-17

Baseline develop `20ed215`. This increment preserves the dashboard, OAuth/session contract,
IAM schema and runtime image configuration. It extracts access values and mutation policy
from framework/persistence code, and strengthens executable dependency boundaries. No
library/version upgrade, paid model call, host-site edit or production action occurred.

## Local verification

WSL/Linux, Node24.21.0 and frozen dependencies:

- `npm ci --no-audit --no-fund`: passed.
- `npm run format:check`, `npm run lint`, `npm run typecheck`: passed. Lint retains
  pre-existing informational/warning diagnostics outside this change; no errors.
- `npm test`: **62 passed**, including eight architecture tests with negative graph
  fixtures and three framework-free access-use-case tests.
- `npm run test:auth` with an owned loopback PostgreSQL18.6 test database: **2 passed**.
  The real adapter was driven through the new use cases, including a forged owner snapshot
  rejected by transactional membership checks. OAuth used the existing deterministic
  loopback provider; no live Google/GitHub application configuration is implied.
- `npm run build`: passed with production routes and traced migration runtime.
- Available-state Playwright: **42 passed / 3 deliberately skipped**, Chromium, Firefox
  and WebKit, about2.2minutes. Checks include EN/ES, light/dark, mobile/landscape/text size,
  owner/viewer restrictions, invitation confirmation, Escape/focus, private operations
  and honest health/readiness. The three skips belong to the separate unavailable fixture.
- Separate unavailable fixture: **3 passed** across all engines (22.4s).
- Separate malformed-payload fixture: **3 passed** across all engines (19.5s).
- `npm run contract:install` and `npm run contract:generate`: passed; both generated
  wire-type artifacts remain unchanged.
- `npm run docs:check`: 156 local references checked, none missing.
- `npm run skills:check` and skill-creator structural validation: passed.
- `npm run security:check`: 163 text files, zero known-pattern findings; not a complete
  secret audit. Signed fixture-session files are private ignored artifacts, not evidence
  to publish.

The installed compiler API package is the documented build-only compatibility tool;
TypeScript7.0.2 remains the primary checker. Guards inspect the actual source graph,
including relative/dynamic/type-only/import-equals paths, cycles, emitted `.js` import
specifiers, directives after comments and transitive client/server dependencies. An
explicit Server Action is a deliberate RPC boundary, not a general client exception.

Real service/image/security/browser verification remains required in current-head PR CI.
These local results do not prove production OAuth, proxy configuration, physical-device
behavior or a browser performance improvement. No visual redesign or new bundle dependency
was introduced. Static architectural checks complement authorization/behavior tests and
code review; they are not a sandbox or complete proof of side-effect freedom.

## Cross-session follow-up

The bounded portfolio review reproduced a source-enumeration omission for `.mts` and
`.cts`. The analogous backoffice collector now includes both suffixes; graph resolution
also follows emitted `.mjs`/`.cjs` specifiers and TypeScript module index files. Negative
fixtures exercise the actual source filter, forbidden domain imports, transitive
`server-only` dependencies and cycles. TypeScript include patterns cover the additional
source suffixes as well. No application runtime or dependency changed. The owner-relayed
Pequeverso scope confirmation completes the four-session ownership matrix.

The follow-up passed local unit/contract, strict type generation/checking, formatting,
lint (the same pre-existing non-error diagnostics), docs, skills and public-file checks.
Its own exact-head full CI is required before integration; no earlier run is reused.
