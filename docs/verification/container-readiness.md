# Backoffice container acceptance — 2026-10-10

This increment optimizes the existing authenticated backoffice. It does not enable the
portfolio assistant, deploy a VPS, publish an image or implement the missing operational
API. The baseline is develop `f29b6cd91b6869c7ad190067ef9ca53fdfc06312`.

## Environment and measurements

Linux/WSL, amd64, four available CPUs, Docker Engine 29.1.3 with containerd image store,
BuildKit 0.26.2, isolated Buildx 0.38.0, Node 24.21.0. Production uses Next 16.3.8,
TypeScript 7.0.2 checking and the existing official TypeScript 6 compiler API (the
installed compatibility package reports 6.0.3). PostgreSQL fixture: 17.11 Alpine,
private task network and disposable tmpfs. No paid model or live OAuth call occurred.

| Image | Docker-reported local disk size | Image inspect content bytes |
| --- | ---: | ---: |
| Original full production dependency copy | 955 MB | 198,528,077 |
| Standalone plus traced migration, slim runtime | 417 MB | 98,245,234 |
| Same trace, distroless runtime | 302 MB | 72,706,013 |

Docker's containerd store retains compressed and unpacked data; disk size is not the
registry download size or uniquely reclaimable disk space. Local disk footprint fell
about 68%; inspect content bytes fell about 63%. Base layers can be shared. The dependency
patches below are also included, so this is an application-image comparison, not an
isolated experiment proving one optimization's contribution. Different builders/cache
conditions and one transient build-time Google Fonts fetch failure prevent a credible
build-speed comparison. No browser/bundle speedup is claimed.

The final local image ID is
`sha256:be394317f8105531e6d0d01f76781f84f36f6b43afd4ba35cee7a5b2b8232670`;
it is **not a published registry digest**. Both builder and runtime report Node 24.21.0.
The migration closure adds 1,218 traced files / 4,419,938 bytes to Next standalone.
It excludes executable tracer/compiler code and npm. Next-traced package metadata can
remain (for example, TypeScript's manifest); resolving the tools' executable entry points
fails. Do not delete dependency metadata blindly. The build context is approximately
535 kB, using a deny-by-default allowlist.

With a read-only root, UID65532, 512 MiB / no additional swap, 0.75 CPU, 128 PIDs and
two 32 MiB tmpfs paths, 64 anonymous sign-in/health requests at concurrency eight
completed in 2,398 ms (p50 221 ms, p95 1,181 ms). Memory gauges were 53.46 MiB idle and
72.45 MiB afterward, with 11 PIDs. These are samples, **not peak measurements** or a
capacity test. Final idle SIGTERM finished in 492 ms, exit143, no OOM; active-request
draining, real dashboard load, TLS/proxy behavior and VPS contention remain unverified.

## Security and finite acceptance

Next 16.3.6 was patched to 16.3.8, sharp to 0.35.5 and source-map-js to 1.2.2 using
compatible locked updates. Root and isolated tooling npm audits are separate checks.
The previous slim runtime additionally exposed OS/npm vulnerabilities; npm audit alone
would have missed them. The pinned distroless runtime has no shell or package manager.

Trivy 0.75.0, freshly downloaded vulnerability DB, scanned the final local image:
zero HIGH/CRITICAL, 23 MEDIUM and eight LOW OS findings, no Node package findings.
The full report remains available; medium/low findings require ongoing triage, not a
claim of a vulnerability-free image. CI now scans OS and libraries, retains every
severity, and fails HIGH/CRITICAL even without an available fix. No suppression file
or ignore-unfixed flag is used. Rescan the actual selected digest before deployment.
All remaining local findings were in libc6, GCC runtime libraries and zlib with no
packaged fix listed by that scan; no exploitability assessment or permanent waiver is
claimed. The image's actual exec healthcheck fails without configuration while process
liveness succeeds, and reports healthy with the isolated migrated PostgreSQL configuration.

| Criterion | Evidence / boundary |
| --- | --- |
| Reproducible application build | Frozen install, digest-pinned builder/runtime, standalone assets and migration trace built successfully |
| Strict validation | 48 unit/contract tests pass; TS7 with generated route types, Biome and public-file scan pass |
| Runtime migration | Actual PostgreSQL schema migration succeeds with non-root/read-only bounded image |
| Authentication boundaries | Two real-PostgreSQL integration tests exercise local OAuth exchange, invitations and revocation; production providers unverified |
| Runtime isolation | Anonymous operations401, readiness200, actual probe rejects missing configuration, only documented tmpfs writable, executable compiler absent; resource/log profile checked |
| Browser regression | 21 available and three unavailable-mode cases pass against the final production image in Chromium, Firefox and WebKit, including axe, locales/themes, focus and mobile overflow |
| Termination | Idle SIGTERM observed; active requests and proxy-stream drain pending |
| Production | No registry publication, Coolify deployment, DNS, production secret, provider call or portfolio enablement |

## Reproduce and inspect

From a clean checkout: `nvm use`, `npm ci`, `npm run contract:install`, then README's
static checks. Build with BuildKit:

```sh
docker build --platform linux/amd64 -t portfolio-assistant-backoffice:rc .
```

Provide only synthetic runtime configuration to an isolated PostgreSQL instance.
Run `node scripts/auth-migrate.ts` in the image using the profile in
[Quality](../../.github/workflows/quality.yml), then start the same image with that
profile and a free loopback port. Use an owned name matching
`portfolio-backoffice-<task>`; never inspect full environment or reset shared data.

```sh
node scripts/verify-container.ts measure portfolio-backoffice-example http://127.0.0.1:3118
node scripts/verify-container.ts shutdown portfolio-backoffice-example
```

The latter stops that named fixture container. Earlier idle SIGTERM samples after browser
verification were 551 ms and 2,577 ms, exit143. JSON measurements are under ignored
`.artifacts/container/`. CI retains measurements, full vulnerability JSON and browser
evidence separately; private fixture environment/session files are never uploaded.
Use the exact checksum-verified scanner command in Quality to reproduce the image gate.

References: [Next standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output),
[@vercel/nft TypeScript tracing](https://github.com/vercel/nft),
[distroless runtime](https://github.com/GoogleContainerTools/distroless),
[Docker containerd store](https://docs.docker.com/engine/storage/containerd),
[local log rotation](https://docs.docker.com/engine/logging/drivers/local/).
