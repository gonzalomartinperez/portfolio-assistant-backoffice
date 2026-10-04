# Backoffice authentication

The source repository is public; operational data requires an invited account.
Better Auth 1.7.7 handles OAuth and PostgreSQL sessions. Google and GitHub are the
only production providers. Password login and public registration are disabled.
The application validates verified email and database membership on every protected
request. A cookie alone never grants access. All credentials remain server-only.

## Configuration and providers

Set the server-only variables in `.env.example`. `BACKOFFICE_ORIGIN` is an exact
origin without paths, credentials or query strings. Public origins require HTTPS;
HTTP is accepted only for exact loopback hosts for local image verification.
Register callback URLs `<origin>/api/auth/callback/google` and
`<origin>/api/auth/callback/github` in owner-managed OAuth applications.
Use separate development and production OAuth applications. Never include their
secrets in client variables, Docker arguments or artifacts.

`BACKOFFICE_OWNER_EMAIL` is the explicitly configured, verified owner identity;
the first arbitrary user does not become owner. Changing that configuration is an
access-policy change requiring review. Owner membership cannot be revoked through
the UI. Existing owners must be reviewed separately before rotating ownership.

OAuth tokens are encrypted using `BETTER_AUTH_SECRET`. Keep that secret stable and
back it up securely; rotation can invalidate sessions and stored provider tokens.
Cookies are HttpOnly, host scoped and Secure on HTTPS. Sessions expire in 8 hours,
with cookie caching disabled. Revocation deletes sessions and every subsequent
request rechecks membership. Implicit provider linking is disabled; linking must
be initiated from an authenticated account through Better Auth's supported flow.
Owners can initiate explicit linking from `/access`; viewer linking UI is deferred. Better Auth telemetry is disabled.

## Database and migrations

Provision a separate PostgreSQL database and least-privileged application role.
Do not reuse the anonymous conversation database or expose its port publicly.
Run `npm run auth:migrate` before starting the new application revision.
The script uses the official `better-auth/db/migration` API for the pinned library
and applies `migrations/001-access.sql` transactionally with an advisory lock.
Better Auth's schema migration is separate from the access-table transaction;
backup and inspect the migration plan before production upgrades. Application
rollback does not undo schema changes. Never execute migrations automatically on
server startup. Restart after external schema changes.

The production image must include `scripts/auth-migrate.ts`, the auth configuration,
runtime and store modules, and `migrations/`. Their runtime dependencies are
`better-auth` and `pg`; migrations do not import Next.js or `server-only`.
The application uses a five-connection pool with bounded connection establishment.
The deployment owner must allow graceful connection draining during termination.

## Invitations and revocation

Owners use `/access` to invite viewers. The copied link is a sensitive bearer
invitation: deliver it privately. Only its SHA-256 digest is stored. The recipient
must authenticate with the exact invited, provider-verified email; the link does
not replace OAuth. It is consumed atomically at session admission and expires in
48 hours. Revoked and expired invitations fail closed. No SMTP service is needed.
Access changes are audited by actor ID, action, subject ID and timestamp without
provider tokens or transcripts. Viewer accounts cannot invite or revoke anyone.

The invitation landing response clears the token from the visible URL, uses
`no-store` and `no-referrer`, and stores it in an HttpOnly cookie for the OAuth
round trip. Effective proxy access logs must redact invitation query parameters;
no frontend analytics or session replay is included.

## Verification

- `node --test tests/unit/auth-config.test.ts`: configuration and token boundaries.
- `BACKOFFICE_DATABASE_URL=<isolated-test-db> node --test tests/integration/auth.test.ts`:
  actual PostgreSQL schema, supported OAuth plugin authorization/callback/token
  exchange with a loopback provider, state rejection, owner admission, verified
  email, one-use invitation, roles, expiry, revocation and CSRF protection.
  **This test truncates its configured database. Never use production or a shared database.**
- `scripts/auth-fixture-session.ts` creates sessions through Better Auth's actual
  adapter for browser tests. It requires loopback origin and a database name
  containing `test` or `fixture`; there is no application authentication bypass.
  CLI writes private cookie artifacts to `BACKOFFICE_FIXTURE_SESSION_FILE` rather
  than printing tokens. Artifacts must remain ignored and excluded from CI uploads.

The deterministic provider does not prove Google/GitHub application configuration.
Before release, manually verify both real providers, invitation recipients,
provider linking, secure effective cookies, CSRF and session revocation over TLS.
Actual provider credentials and production deployment are not authorized here.

Official references: [Next.js integration](https://better-auth.com/docs/integrations/next),
[database and migrations](https://better-auth.com/docs/concepts/database),
[account linking](https://better-auth.com/docs/concepts/users-accounts),
[hooks](https://better-auth.com/docs/concepts/hooks).

## Presentation and availability

Authentication surfaces support typed US English and neutral Latin American
Spanish copy. Supported `?locale=en|es` parameters take priority over the
`backoffice-locale` cookie; English is the safe default. Callback, invitation and
back links retain that preference. Locale never changes authorization policy.
Protected routes redirect infrastructure failures to a safe unavailable sign-in
surface; provider controls are disabled until configuration and database schema
are ready. No raw database or OAuth errors are rendered.

Revocation requires a native modal confirmation, supports Escape, and restores
focus to its trigger. Invitation copy feedback is bound to the current link and
resets for a newly created invitation. Styles reuse semantic tokens and the owned
button component; no independent theme or reset is introduced.
