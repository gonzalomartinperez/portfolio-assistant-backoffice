# Conservative dependency maintenance

Implementation is staged on develop. **Automatic merging is not activated.** Default branch
main does not yet contain the trusted policy scripts/workflow; repository auto-merge is off.
An actual Actions probe also found that its read-only GITHUB_TOKEN cannot inspect the full
branch protection via GraphQL. Both activation switches must remain off until a supported
least-privilege inspection mechanism is verified. This is a blocker, not permission to use
a broad PAT or merge the application release into main.

## Eligibility

[Policy implementation](../scripts/dependency-policy.ts) is deliberately small:

| Dependency | Automatic candidate |
| --- | --- |
| @types/node | Patch within major 24 |
| @types/react | Patch or minor within major 19 |
| @types/react-dom | Patch within major 19 |

These type-only updates are covered by full strict typing, generated Next routes, build and
browser/API tests. They are candidates, never unconditional approvals. Every changed lock
entry must also qualify. New/removed packages, changed dependency relationships, install
hooks, non-registry tarballs, unexpected fields and unknown transitive updates are manual.
Package scripts, runtime dependencies, permissions and application code cannot change.
The current exact manifest pins make lockfile-only changes ambiguous: those remain manual.

Everything else requires review: majors, prereleases, 0.x, downgrades, frameworks/compiler,
Markdown/security/session/persistence packages, test engines, Actions, Docker/OS, mixed-risk
groups and unrecognized metadata. Development dependencies are not automatically harmless.
Groups qualify only if every update passes. Authenticated GitHub author ID/login/type,
same-repository source, develop base and one verified GitHub-signed Dependabot commit are
required. Human additions or rebases are manual; titles and labels never grant eligibility.
`dependencies:manual` vetoes automation. For immediate intervention, disable auto-merge in
the PR UI first, then apply the label; event processing is not instantaneous.

## Controls and event flow

Quality remains the complete unprivileged PR pipeline. Its existing required `checks` name
is preserved. The separate [policy workflow](../.github/workflows/dependency-policy.yml)
executes only default-branch scripts with Node built-ins: no PR checkout, package install,
PR artifact, external shell interpolation, approval or direct merge API. Checkout credentials
are not persisted. Existing reviewed checkout/setup-node SHA pins are reused.

The control job needs contents:write and pull-requests:write for native auto-merge,
checks:write for the head-bound `dependency-policy` check, and actions:read to inspect Quality.
Protection uses the GraphQL branchProtectionRule read path; the REST protection endpoint
requires Administration:read, which GITHUB_TOKEN cannot request. The existing static job
probes the GraphQL query with its read-only workflow token. If GitHub explicitly denies it,
the static job requires BOTH activation switches to be disabled and reports the blocker.
Network/schema errors still fail; denial while either switch is enabled also fails. The
mutation controller always fails closed on inaccessible protection. This diagnostic does
not declare deployment/automation readiness. No production secret, PAT,
environment or self-hosted runner is used. All other permissions
are absent. A permission/API error fails closed; do not add a broad PAT to work around it.
The API client prints fixed decision codes, never raw API responses or credentials.

On PR opening, synchronization, reopening, base/draft/label changes and manual auto-merge
requests, reevaluate current API data. Quality completion also reconciles the current PR,
not blindly the triggering run. Concurrency is per PR; different PRs do not cancel each
other. New heads need a new policy check. Superseded queued events are safe because the
next run rereads current state. Native required checks remain authoritative.

For a Dependabot PR the controller first disables any existing auto-merge, then checks the
complete manifest/lock delta. It requires strict branch protection including both `checks`
and `dependency-policy` (the latter bound to GitHub Actions app ID 15368), administrator
enforcement, no force pushes/deletion, current develop ancestry and a conflict-free head.
It verifies the latest full Quality run for that head and all five successful jobs, including
the run's authenticated Dependabot actor. Missing, failed, pending, cancelled or skipped
verification cannot arm auto-merge. Reruns by a human deliberately require manual review.

The policy check remains pending while native squash auto-merge is armed. GitHub then
applies **all** required checks, approvals, conversation resolution and strict up-to-date
rules, including future additional requirements. No review is created. Ineligible PRs get
a successful *manual-only decision* after auto-merge is revoked, so normal reviewed merges
are not blocked by eligibility policy. Verification failures leave a failed policy check.
A newly required human approval remains mandatory and may prevent unattended integration.

## Repository audit and activation

2026-09-27 authenticated audit: public repository, default main, all three merge methods
allowed, auto-merge false. Develop protection requires `checks`, strict updates,
administrator enforcement and conversation resolution; zero mandatory approvals, no force
push/deletion, no rulesets/merge queue. Default workflow token is read-only and Actions
cannot create approving reviews. No open Dependabot PR was available for live merge testing.
Public GitHub Free supports these controls; private Free repositories may not. Verify actual
plan/protection availability after any visibility/ownership change, rather than assuming it.

Activation must be a separately authorized, reviewed operation:

0. Resolve protection inspection access first. Run 36336719405 demonstrated GraphQL
   rejection with the read-only workflow token; local admin success is not compatibility
   evidence. A separately reviewed repository-scoped read-only GitHub App may be needed;
   no App/PAT or new secret is created here. Do not enable either switch until the exact
   intended token path is tested. This repository does not silently weaken the requirement.
1. Promote only the approved workflow, policy scripts, their `scripts/json.ts` helper and Dependabot configuration to
   the default branch through its normal PR/review process. Do not merge an application
   release merely to activate maintenance. The scripts have no npm dependency prerequisite.
2. Set repository variable `DEPENDABOT_POLICY_READY=true`. This bootstrap switch stays true
   during ordinary pauses. With `DEPENDABOT_AUTOMERGE` unset/false the job evaluates and
   revokes bot auto-merge but does not arm it. Dispatch against an ordinary open PR to
   establish a successful `dependency-policy` check on its head. Verify actual GITHUB_TOKEN
   permissions, including GraphQL branchProtectionRule reads, without expanding credentials if unavailable.
3. Add required `dependency-policy`, bound to app 15368, **preserving** `checks`, strictness,
   reviews and all existing protections. Reconcile all open PRs before requiring it so none
   is stranded awaiting an event. Check on an actual eligible Dependabot PR that Quality
   runs for the current revision and policy cannot be bypassed by a modified head.
4. Enable repository native auto-merge and set `DEPENDABOT_AUTOMERGE=true` only after the
   above checks succeed. Dispatch one eligible PR and inspect native auto-merge, required
   checks and merge result. If an essential control is unavailable, leave automation off.

Neither variable, repository auto-merge setting nor required policy check was activated by
this implementation. Full mutation/token behavior remains unverified until the authorized
default-branch promotion. The ordinary Quality tests do exercise the decision/controller
against deterministic authenticated-API fixtures; those are not a live automatic merge.

## Rebasing, security and maintenance

Version updates target develop monthly, bounded to three npm/two Actions/two Docker PRs.
Only React-type patches are grouped; broad development-tool grouping was removed. npm
routine updates have seven-day cooldown; security alerts/fixes must not wait on this routine
schedule. Native `rebase-strategy: auto` handles relevant base/dependency changes. Updated
heads run PR CI again. Dependabot stops automatic rebasing old PRs after about 30 days and
may not safely rebase conflicts or human-modified work. Review those manually; no rebase bot,
repeated comments, force pushes or custom branch-push reconciliation loop is installed.

Security updates concern the **default branch**, even though version updates target develop.
Do not retarget/close them blindly, suppress alerts or mistake a green develop build for a
security fix on main. Security fixes receive prompt manual attention and the same risk checks.
The earlier alert API inspection could not establish enabled alert access; owner verification
of Dependabot alerts/security updates remains required. Develop-only ignore/cooldown settings
are not effective until the default-branch configuration is promoted.

GitHub-token mutations do not generally trigger ordinary push workflows. This repository
intentionally has no post-merge deployment/push pipeline; the tested PR revision is the gate.
Dependabot itself owns future rebases and PR events. Do not infer a new release, image publish
or production deployment from a merge. Inspect actual reruns after rebasing during activation.

Pause: set `DEPENDABOT_AUTOMERGE=false`, explicitly disable auto-merge on currently armed PRs,
and dispatch reconciliation for each. Changing a variable alone emits no PR event. Keep
`DEPENDABOT_POLICY_READY=true` so required decisions continue. Never switch off the whole
workflow while its check is required. For one PR, disable native auto-merge and add the veto.
Recover a bad merged update with a reviewed revert/fix PR into develop and the full CI graph;
never rewrite shared history or automatically roll back a deployment.

## Verification

`node --test tests/unit/dependency-policy.test.ts` runs policy, mocked controller and workflow
security tests; `npm test` includes them in the existing static job. They cover allowlisted
patch/minor, major/prerelease/0.x/unknown, groups/transitives, spoofing, files/scripts, human
commits, wrong base, head changes, stale branches, conflicts, failed/missing/cancelled/pending
checks, pause/veto, API failure, ordering and a strictly read-only invocation.

For an authorized read-only audit with an existing local gh login:

```sh
GITHUB_REPOSITORY=gonzalomartinperez/portfolio-assistant-web \
PR_NUMBER=123 GH_TOKEN="$(gh auth token)" node scripts/dependency-automation.ts
```

The default is read-only; do not set `APPLY_DEPENDENCY_POLICY` locally. Replace 123 with the
actual PR number. No fake vulnerability PR is needed. Actual run evidence is recorded in
[CI documentation](ci.md); activation limitations remain explicit.

Official references (reviewed 2026-09-27): [native auto-merge](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/automatically-merging-a-pull-request),
[Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference),
[rebase limitations](https://docs.github.com/code-security/supply-chain-security/keeping-your-dependencies-updated-automatically/managing-pull-requests-for-dependency-updates),
[event/default-branch requirements](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
[privileged workflow security](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target),
[token event behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
