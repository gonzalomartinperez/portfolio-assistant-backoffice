# ADR 002 — Shared VPS and one public assistant origin

Accepted 2026-09-27 by owner instruction; supersedes managed Node hosting proposals.

The public frontend and iframe assumptions below are superseded by [ADR 004](004-native-chat-and-private-operations.md).
Shared hosting and vps-ops authority remain valid.

The future Hostinger KVM 4 hosts both assistant containers. The portfolio stays on
Hostinger Business; its managed Node slots remain reserved. Proposed public origin:
`https://assistant.gonzalomartinperez.com`. This decision authorizes preparation, not
purchasing, provisioning, DNS, production secrets, remote deployment or main promotion.

One shared reverse proxy terminates TLS, sends `/` to Next.js port 3000 and preserves
`/api/*` to FastAPI port 8000. There is no Next BFF, URI replacement or extra `/api`
prefix. FastAPI `root_path` stays empty. `/docs` and `/openapi.json` are API-internal
operator endpoints, not exposed by this routing; public frontend routes own `/`.
Contracts come from committed artifacts, never a rewritten proxy documentation URL.
Internal readiness uses the API's `/health/ready` and web `/` on private networks.

The browser uses relative `/api/v1/...`. Public environment values are build-time
constants; the production image has no API origin override. No internal URL or secret
is needed by the frontend server. The API owns credentials, retention and CSRF policy.
Production cookies are host-only `__Host-assistant_session`, Secure, HttpOnly,
SameSite=Lax and Path=/; no Domain attribute. Same-origin requests still need exact
Origin validation, bootstrap and CSRF headers.

Portfolio revision `e411c0a775b16fd7de962774d875e47191f96b09` has a native panel calling
the API and a standalone link, not an iframe. Preserve it. The explicit production
origin allowlist is the assistant origin above and `https://gonzalomartinperez.com`.
No wildcard credentialed CORS; no assumption that parent-domain sharing removes CORS.
Do not add www/preview origins without a concrete consumer and review. Framing is not
required; deny it at the edge. Both sites must use HTTPS for same-site cookie behavior.

Coolify is the selected management platform, coordinated through the private vps-ops
repository. That repository owns production composition, proxy/TLS, private networks,
volumes, budgets, release selection, migration scheduling, deployment and recovery.
Application repositories own tested images and runtime contracts. The frontend
[contract](../deployment-contract.md) is the committed integration handoff.
`tests/integration/compose.yaml` remains isolated fixture verification, not a production
stack. vps-ops will verify the exact supported Coolify prebuilt-image workflow; normal
releases use immutable tested digests, not source rebuilds on the VPS. Do not add another
proxy/controller, application SSH deployment, webhook or automatic deployment trigger.
Only the shared proxy publishes application ports; restrict admin ingress separately.
Image publication, package visibility and production execution require separate decisions.

A single VPS is not HA. Graceful termination may interrupt active streams; the client
must preserve partial content and avoid automatic regeneration. Capacity, backups, TLS,
real devices, optional Cloudflare behavior and production approvals remain release gates.
