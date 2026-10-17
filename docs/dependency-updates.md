# Manual dependency maintenance

The owner-selected profile is **manual merging**, including low-risk Dependabot
proposals. Native auto-merge is off; no workflow approves, rebases, pushes, arms
or merges a PR. Existing risk classification and synthetic controller regressions
are retained as assessment tools, not evidence of live automatic merging.
The CLI rejects write-activation flags; the trusted workflow has only contents/read
and pull-requests/read permissions. Production publication/deployment is unrelated.

## Proposals and review

Version-update proposals run weekly, target `develop`, use native
`rebase-strategy: auto`, bounded open-PR counts and small risk-based groups. The
seven-day routine npm cooldown does not delay security updates. The contract-generator
workspace is independent; its compiler-major ignore preserves the documented TypeScript5
programmatic API compatibility while the application uses TypeScript7. Do not hide
security alerts to enforce that compatibility exception.

Security updates follow GitHub's default-branch behavior and may target `main`.
They remain visible and require prompt manual review; `target-branch: develop` is
not a guarantee about security proposals. A default-branch security fix follows the
normal protected workflow, never administrative bypass or an automatic main merge.
Dependabot configuration and target workflows become effective from the default branch;
a develop-only change is not live activation evidence.

## Risk assessment, not approval

The classifier accepts only authenticated Dependabot identity, expected source repo,
base and complete file/commit scope. It compares manifests and lock entries semantically;
titles and labels do not authorize anything. `@types/node`24 patches, `@types/react`19
patch/minor and `@types/react-dom`19 patches are the narrow low-risk assessment cohort.
Every grouped or transitive update must qualify. All updates still need human review.
Majors, prereleases, unstable0.x, unknown metadata, runtime/compiler/framework, IAM,
cryptography, persistence, Actions, Docker/OS, mixed-risk groups, lock-only ambiguity,
script changes, unexpected files and human-added commits require closer investigation.
`dependencies:manual` is a veto, never approval.

The separate policy workflow reads trusted default-branch scripts, never a PR checkout,
PR dependencies or artifacts. It does not repeat after every Quality run. A skipped
human-PR diagnostic is not a required check. Required Quality `checks` still covers the
complete application with strict branch freshness and administrator enforcement.
Missing/failed/pending checks, conflicts or blocking reviews are not mergeable.
Do not replace mandatory reviews with a bot approval, PAT or merge-anyway operation.

After a reviewed promotion, dispatch a read-only assessment with
`gh workflow run dependency-policy.yml -f pr_number=<existing-pr>`.
Local API fixtures test spoofing, all group members, scripts/file changes, revision
changes, missing/failed checks and branch advancement. They do not prove live GitHub
bot behavior. A real bot PR, when available, must be checked against its current SHA.
Readiness inspection can report missing GITHUB_TOKEN protection visibility; it is not
permission to weaken branch rules or enable automation.

Native rebasing refreshes eligible young PRs when relevant base/dependency changes occur;
CI runs again for new revisions. Old (about30days), conflicted or human-modified PRs may
need manual intervention. There is no custom rebase bot, force-push loop or comment spam.
Pause proposals using Dependabot configuration through a normal PR; to defer one PR,
leave it open with a clear explanation. Never suppress a security alert to reduce churn.
Recover a problematic merged update by a reviewed revert/fix PR with the same checks.
Application rollback does not reverse migrations or authorize a deployment rollback.

## Controls observed and verification

Both permanent branches keep their existing protections. Repository auto-merge remains
false and legacy activation flags must be false/unset. Inventory open bot PRs and revoke
any already-armed native request before claiming the manual profile is reconciled.
No label can substitute for these controls. Actual settings/Actions evidence is recorded
in the delivery report; local fixtures alone are not a live workflow result.

References: [Dependabot options](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference),
[native rebasing limitations](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-pull-requests-for-dependency-updates),
[secure workflow guidance](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).
