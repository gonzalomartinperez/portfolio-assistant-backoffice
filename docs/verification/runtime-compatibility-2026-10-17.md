# Fixed runtime compatibility review — 2026-10-17

Base main `d16a10c`; manual cohort cutoff17:35UTC. React/DOM/is19.3.1 and Better Auth1.7.10
are reviewed separately from the earlier tooling patch. No new provider, plugin, open signup,
password login, client telemetry, dashboard capability or production trigger is enabled.

## Decisions and primary evidence

[React19.3.1](https://github.com/react/react/releases/tag/v19.3.1) is adopted with matching
React DOM and react-is versions. Next16.4.2/Node24.22.0, TypeScript7 and its documented
compiler-API/generator arrangement remain unchanged. No new component styling or hooks are
introduced to make the patch pass.

Reviewed cumulative Better Auth releases
[1.7.8](https://github.com/better-auth/better-auth/releases/tag/v1.7.8),
[1.7.9](https://github.com/better-auth/better-auth/releases/tag/v1.7.9) and
[1.7.10](https://github.com/better-auth/better-auth/releases/tag/v1.7.10). Relevant changes
include cookie attribute alignment, async initialization, awaited error handling and core
JWKS handling. Changes to One Tap, password reset, SAML, OAuth-provider and other optional
plugins do not imply those features are configured or supported here.

The resolved Better Auth core/adapters/telemetry packages stay on the same1.7.10 cohort;
utils advances0.4.2→0.5.0, better-call1.4.0→1.4.2 and the duplicated nested utils entry is
removed. The lock also changes Kysely0.29.6→0.29.7, nanostores1.5.4→1.5.5,
set-cookie-parser3.1.2→3.1.4 and Zod4.6.5→4.6.7. These are recorded closure changes, not a
classification of every transitive/auth change as low risk. Existing logger/telemetry disablement,
server-only tokens, live membership and transactional owner checks remain required.

## Executed and required verification

Local WSL/Linux on pinned Node24.22.0: frozen install, zero npm audit findings, **68 unit/
contract tests passed**, strict generated-route TypeScript checking, formatting/lint and
redacted current/history scan passed. The same pre-existing non-error lint diagnostics remain.
No private wire artifacts or owned SQL migrations change.

The real PostgreSQL/fake-OAuth integration suite now also checks the emitted session cookie
for HttpOnly, SameSite=Lax, root Path and absent Domain. This is a host-scoped loopback
fixture assertion, not proof of production HTTPS or live Google/GitHub registrations.
Full exact-head CI must verify these assertions plus invitations, OAuth admission/replay,
expired/revoked membership, CSRF/origin denial, real migration/restore/persistence, image
vulnerability gates and all Chromium/Firefox/WebKit operations/accessibility scenarios.

No local heavy browser/build fixtures are started while vps-ops owns its VM capacity lease;
CI uses isolated managed runners. Browser cache protection remains in force. There is no
claimed bundle/render/latency gain, physical-device validation, production OAuth, registry
publication, analytics activation or deployment. The PR records actual CI outcomes.
