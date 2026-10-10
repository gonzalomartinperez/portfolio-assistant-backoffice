# ADR 005 — Traced migration closure and bounded distroless runtime

Accepted for application preparation; production execution remains vps-ops authority.

Next standalone traces server routes but not our separately executed IAM migrator.
Copying all production node_modules on top of standalone preserved it at the cost of
duplicated dependencies and unnecessary runtime surface. The slim Node base also retained
npm and OS packages with HIGH/CRITICAL findings missed by npm's application audit.

Keep Next's supported standalone output and add only the migrator's dependency closure
using the published, pinned build-only `@vercel/nft` package. Its documented `readFile`
hook uses the existing official TypeScript 6 API for tracing; Node executes original
erasable TypeScript. No private Next tracing API, custom package resolver or runtime
compiler. Narrow optional-driver exceptions are reviewed; unknown required imports fail.

Use digest-pinned distroless Node24 Debian13 nonroot, preserving the builder's verified
Node24.21.0 runtime. It has no shell/npm. Empty entrypoint preserves exec-form application
and migration commands. Include static/public assets and reserve the cache directory.
The cost is shell-free operational commands and an explicit migration tracing dev dependency.

Validate the same image with isolated PostgreSQL, UID65532, read-only root, bounded tmpfs,
memory/CPU/PIDs, capabilities dropped, bounded logs, browser/auth checks and idle SIGTERM.
Scan OS and libraries once, retain every severity and reject HIGH/CRITICAL without
ignoring unfixed findings. Do not equate that gate with a complete security audit.

[Container evidence](../verification/container-readiness.md) records measured reductions
and limitations; [runtime contract](../deployment-contract.md) is canonical for vps-ops.
No production stack, controller, publication or deployment is added. Monitor rescan results
and let the API owner independently optimize its image without removing sync/runtime needs.
