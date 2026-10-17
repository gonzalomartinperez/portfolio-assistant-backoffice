# Runtime baseline acceptance — 2026-10-17

The owner authorized execution of the shared deployment-readiness plan. This repository owns
its code, tests, image and runtime contract. The private vps-ops inventory owns the shared
baseline/routing/release policy; Coolify remains the sole deployment executor.

| Applicable component | Exact committed lock version |
| --- | --- |
| `next` | `16.4.2` |
| `react` | `19.3.1` |
| `react-dom` | `19.3.1` |
| `better-auth` | `1.7.10` |
| `pg` | `8.23.1` |
| `typescript` | `7.0.2` |
| `@biomejs/biome` | `2.5.15` |
| `@playwright/test` | `1.64.1` |

The lockfile is authoritative for the complete dependency graph. This dated view does not
assert that these versions remain the newest forever or that an image has been published.
Node24.22.0 is LTS; Next16.x is Active LTS. React, TypeScript, authentication libraries and test tools do not acquire LTS status from that choice. Node26 Current/types are excluded. This backoffice uses a Trixie builder and a digest-pinned nonroot Node24 distroless runtime. Other applications retain independently tested pins.

## Image and operations boundaries

Build dependencies are isolated from the runtime. Frozen installs and dependency-cache mounts
reduce repeated downloads; cache content is not copied into the runtime. Dockerfile frontend
and image bases are digest-pinned. Private registry visibility and immutable release manifests
remain prerequisites for publication and deployment; local image identifiers are not registry
provenance. Images are built in application verification, never rebuilt on the VPS.

The image uses UID/GID65532, exec-form Node probes, no shell/npm/global installer, and read-only root with UID65532-owned tmpfs paths. Migration dependencies remain in the same artifact. Changing old UID1000 cache ownership does not authorize changing persistent database ownership; those data use PostgreSQL UID999 separately.

Databases and writable data stay isolated by project. Secret values are excluded from Git,
images, source build arguments and diagnostics. Runtime credentials are delivered by Coolify;
recovery credentials remain independently available. Existing public websites stay on Business
and their assistant activation remains deferred. No deployment trigger is enabled.

## Verification and remaining gates

Frozen installation, formatting/linting, strict typing, unit/contract and documentation/security/skills checks were run locally. Exact-image smoke verifies nonroot/read-only startup and migration closure. Hosted full quality and browser gates still determine integration acceptance; real OAuth and TLS/cookies through the actual VPS remain unverified.

See [deployment contract](deployment-contract.md) for ports, health, secrets, data and shutdown.
The shared baseline does not promise zero downtime, production capacity or an advisory-free
image. Current unfixed OS findings remain visible; no package is removed or scanner weakened
merely to change a vulnerability count.

## October 17 patch review

Selected [Node24.22.0 LTS](https://nodejs.org/en/blog/release/v24.22.0),
[Next16.4.2](https://github.com/vercel/next.js/releases/tag/v16.4.2) and
[Playwright1.64.1](https://github.com/microsoft/playwright/releases/tag/v1.64.1).
Official npm metadata confirms Node/React peer compatibility. Next and all platform SWC
packages advance together; Playwright/test/core advance together. No nightly, forced peer
resolution or compiler downgrade is used. The Dockerfile pins reviewed registry OCI index
digests; isolated probes of both exact images report Node24.22.0. Private registry publication
and deployment are still unauthorized. See
[verification](verification/toolchain-security-2026-10-17.md) for executed checks and limits.

## Fixed runtime compatibility review — October 17, 17:35 UTC

React/DOM/is19.3.1 and Better Auth1.7.10 were evaluated as a separate manual-risk cohort,
not automatically admitted by the dependency policy. Node/Next/TypeScript/Playwright and
base-image pins remain those verified above. Provider plugins, signup/password policy,
private operations contract and application-owned migrations are unchanged. See
[runtime compatibility evidence](verification/runtime-compatibility-2026-10-17.md).
