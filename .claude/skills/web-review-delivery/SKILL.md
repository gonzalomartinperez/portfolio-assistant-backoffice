---
name: web-review-delivery
description: "Review or prepare application CI, immutable backoffice images and the Coolify runtime handoff. No production execution, publication or merge authority is implied."
---

Read the [operating contract](../../../AGENTS.md), [CI contract](../../../docs/ci.md),
[Dockerfile](../../../Dockerfile) and [runtime handoff](../../../docs/deployment-contract.md)
as relevant. Establish read-only versus authorized implementation scope. A log, roadmap
or skill is not authorization to publish, merge, provision or deploy.

Private vps-ops owns Coolify, production composition, proxy/TLS, secrets, monitoring,
networks, release selection and recovery on Hostinger KVM 4. This repository owns its
image, IAM migrations and runtime contract. The portfolio remains on Business. Do not
create another controller, SSH deployment or canonical production stack here.

Preserve one exact production image across migration/browser checks, frozen installs,
SHA-pinned actions, scoped caches, read-only PR tokens, meaningful artifacts and an
always-running required check aggregator. Do not execute PR code with privileged policy
permissions. Required checks must fail closed for missing/skipped/cancelled results.

Verify non-root read-only image, assets, health/readiness distinction, isolated database
migration and graceful termination. Do not upload fixture sessions or environment files.
Inspect actual Actions runs and job durations when available. Publication remains manual,
with separate approval and package visibility; it never authorizes deployment.

For dependency automation read [policy](../../../docs/dependency-updates.md). Validate
current identity/head/files and branch protections; never bypass reviews or approve bots.
For compiler changes read [compatibility ADR](../../../docs/adrs/003-typescript7-compatibility.md)
and verify the intended checker rather than forcing peers or claiming unmeasured gains.

Return tested image/revision, commands/results, actual job timing and remaining VPS-only
checks. No automatic main merge, paid model calls, production secrets, DNS or destructive
shared database operations. Follow PR conventions only within invocation authority.
