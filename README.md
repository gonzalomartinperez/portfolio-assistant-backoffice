# Portfolio assistant backoffice

Authenticated operations for Gonzalo's portfolio assistant. The public conversation UI
now belongs to the portfolio; this application monitors availability, public-knowledge
freshness, execution stages and estimated usage. Public source code does not imply public
access to operational data.

Google/GitHub authentication, verified-owner admission, invited viewers, live revocation
and the bilingual dashboard are implemented. The operational backend contract is still
[requested](docs/backend-operations-request.md), not consumed: real metrics remain unavailable
until that handoff exists. Synthetic test data is labeled. Historical [chat screenshots](docs/verification/interaction-polish.md)
describe the former application, not the current backoffice.

## Local setup

Use Linux/WSL, Node from `.nvmrc`, npm and a dedicated PostgreSQL database:

```sh
nvm use
npm ci
npm run contract:install
cp .env.example .env.local
npm run dev
```

The web runs on `http://localhost:3001`. Configure the server-only variables in `.env.local`
and register exact Google/GitHub callbacks before testing real login. There is no password
login or open registration. See [authentication](docs/authentication.md) for migrations,
provider setup and invitation behavior. Do not point integration or fixture tools at a
shared database. Node commands do not automatically load `.env.local`; pass configuration
explicitly through the process environment when running migrations/tests.
Run `npm run auth:migrate` with that environment before admitting users. The application
does not migrate a database on startup.

For deterministic browser verification, build once and start a disposable PostgreSQL
instance on an available loopback port (the managed fixture defaults to 15432):

```sh
docker run -d --name backoffice-fixture-postgres \
  -e POSTGRES_USER=backoffice_fixture -e POSTGRES_PASSWORD=public-fixture-only \
  -e POSTGRES_DB=backoffice_test --tmpfs /var/lib/postgresql/data \
  -p 127.0.0.1:15432:5432 \
  postgres:17-bookworm@sha256:91eb910c44c7ed13f7f1a4ccadaa9ca72ef14cddc04cacb6e070e48eb44731a3
```

Wait for `docker exec backoffice-fixture-postgres pg_isready -U backoffice_fixture`.
Then run `npm run build` and `npm run test:browser -- backoffice.spec.ts`; the single
managed lifecycle provisions real signed sessions, starts the synthetic operational
service and closes its owned servers. No live OAuth or paid model calls occur. These
credentials are public test values. Remove only this disposable container afterward
with `docker rm -f backoffice-fixture-postgres`. Choose another port and set
`BACKOFFICE_DATABASE_URL` explicitly if 15432 is already occupied.

## Verification

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run security:check
npm run docs:check
npm run skills:check
npm run build
npm run test:auth
npx playwright install --with-deps chromium firefox webkit
npm run test:browser -- backoffice.spec.ts
```

Authentication integration requires a dedicated database whose name includes `test` or
`fixture`; it resets only that isolated database and exercises real PostgreSQL with a
local OAuth provider. Browser verification uses signed fixture sessions and synthetic
operational data. Neither proves live Google/GitHub, production telemetry or model quality.
Private session artifacts must never be committed or uploaded. Commands that require an
unavailable service are unexecuted checks, not successes. [Delivery checklist](docs/work-checklist.md)
tracks current acceptance and blockers.

The primary checker is stable TypeScript 7.0.2 with strict indexed/optional checks.
The official TypeScript 6 compatibility API supports architecture tooling; a separate
frozen generator uses TypeScript 5.9.3 for its required compiler API.
[ADR 003](docs/adrs/003-typescript7-compatibility.md) records exact commands and evidence.
Node 24 executes erasable TypeScript but does not type-check it. The Google TypeScript
readability adaptations and verification conventions are in [CONTRIBUTING](CONTRIBUTING.md).

## Architecture and delivery

[ADR 004](docs/adrs/004-native-chat-and-private-operations.md) defines the public-chat/private-operations
split. Pure operational models, small application ports, HTTP validation adapters and
presentation remain separate; server composition keeps secrets out of client bundles.
[Design system](docs/design-system.md), [agent skills](docs/agent-skills.md) and
[dependency maintenance](docs/dependency-updates.md) provide maintained procedures.

This repository owns its Dockerfile, IAM migrations and [runtime contract](docs/deployment-contract.md).
Private vps-ops owns Coolify and deployment on the future Hostinger KVM 4; the portfolio
stays on Business. CI verifies an immutable image before browser tests. Publication is
manual and separately approved; no production deployment controller is included.
Work enters `develop` through PRs. Main promotion, production OAuth, effective proxy
headers, physical-device testing and backup/recovery remain separate release gates.

Application code retains the [MIT license](LICENSE). Identity assets/fonts retain their
[attribution and terms](THIRD_PARTY_NOTICES.md). See [SECURITY](SECURITY.md) for reporting.
