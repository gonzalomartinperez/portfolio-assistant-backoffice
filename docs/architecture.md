# Backoffice architecture

The root page is a protected, dynamic Server Component. Server-only
`features/operations/entry.ts` composes a bounded HTTP adapter and the application read.
Presentation receives allowlisted view data, never private URLs, tokens or diagnostics.

- `operations/domain`: pure operational models and available, unconfigured or unavailable results.
- `operations/application`: a small read port; no React, Next or concrete networking.
- `operations/adapters`: private HTTP policy, bounded UTF-8 JSON and explicit wire mapping.
- `operations/presentation`: server dashboard and intentional client preference controls.
- `auth`: OAuth configuration, PostgreSQL membership, guarded server actions and account UI.

Dependency tests inspect static, dynamic and type-only imports. Pure layers cannot depend
on frameworks/platform globals, and client components cannot import authentication
infrastructure. The native checker covers application, tooling, tests and generated routes.

Google/GitHub admission requires verified configured-owner or invited-viewer identity.
Every protected page, API and action checks live database membership; hiding a control
never authorizes an operation. IAM storage is separate from conversation data. Explicit
linking, atomic invitations and revocation are documented in [authentication](authentication.md).

Operational reads use no-store, bounded time/body, no redirects and safe failures. Missing
or rejected data stays unavailable. No model call, generation retry, transcript storage
or browser service token exists here. The [backend request](backend-operations-request.md)
is proposed; an operational API contract has not yet been consumed.

[ADR 004](adrs/004-native-chat-and-private-operations.md) defines ownership. The portfolio
owns one native conversation feature for compact, maximized, mobile and page presentations.
Its verified implementation is committed at `7753d39`; 31 assistant unit/network checks
and 68 browser scenarios passed before the old chat and iframe were retired here.

Former implementation source and detailed streaming architecture remain available at
[frontend baseline aed8ea7](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/tree/aed8ea710c8b847ddc9066aaef5ce48d3793b494).
Historical screenshots remain labeled. Retired chat coverage now belongs to the portfolio;
backoffice authentication, operations, dependency policy and boundary checks remain here.
