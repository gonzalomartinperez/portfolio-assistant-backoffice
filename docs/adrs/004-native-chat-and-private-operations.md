# ADR 004 — Native portfolio chat and authenticated operations

Accepted by owner instruction. Supersedes ADR 002's public frontend role and the
iframe delivery model; its shared-VPS and vps-ops ownership decisions remain valid.

The portfolio owns the public conversation interface, using one feature for its
floating panel and full-page demonstration surface. It sends credentialed requests
directly to the assistant API. The API owns sessions, authorization, persistence,
grounding and generation. Public chat is not an administrative backoffice feature.

This repository becomes `portfolio-assistant-backoffice`: public source code with
authenticated operational pages. Google and GitHub authenticate verified identities;
there is no password login, open registration or implicit account linking. A configured
owner invites viewers. Membership is checked in PostgreSQL on every protected request;
revocation removes sessions. This IAM database is separate from API conversation data.

The browser never receives an operational service token. Server adapters read a private,
bounded, runtime-validated snapshot. Metrics and traces contain technical aggregates and
allowlisted stages only: no prompts, answers, credentials, private documents or arbitrary
span attributes. Missing or invalid data is shown as unavailable, never replaced with
fixture values. Synthetic data is explicitly labeled and enabled only for local tests.

The operational API request is documented in [the backend handoff](../backend-operations-request.md).
It is proposed, not an implemented or consumed contract. The inspected API revision is
`c6012067c4a99db477bb6ddcf1f26dae095641ca`; real telemetry integration remains blocked
until its owner publishes a committed compatible handoff. Continue independent fixture
verification without editing that repository or calling a paid provider.

Private vps-ops owns Coolify, proxy routing, monitoring services, networks, databases,
secrets, backups and deployment. This repository owns its image, IAM migrations and
[runtime contract](../deployment-contract.md). Image publication and production deployment
remain separate approvals. No application workflow executes a VPS deployment.

Consequences: no cross-origin iframe protocol or cross-tab transfer is required for the
new product. The public API still needs exact credentialed CORS, CSRF and secure host-only
cookies for the portfolio origin. Existing chat tests are retired here only after their
behavioral coverage has been transferred and verified in the portfolio implementation.
Historical screenshots describe the former frontend, not current backoffice evidence.
