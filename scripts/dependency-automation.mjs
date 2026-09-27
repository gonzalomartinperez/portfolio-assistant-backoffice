import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
	dependencyDecision,
	gateReason,
	identityReason,
	isDependabot,
	POLICY_CHECK,
} from "./dependency-policy.mjs";

export async function readProtection(api) {
	const response = await api("/graphql", {
		query: `query { repository(owner:"gonzalomartinperez", name:"portfolio-assistant-web") {
			ref(qualifiedName:"refs/heads/develop") { branchProtectionRule {
				requiresStatusChecks requiresStrictStatusChecks isAdminEnforced allowsForcePushes allowsDeletions
				requiredStatusChecks { context app { databaseId } }
			} }
		} }`,
	});
	const rule = response.data?.repository?.ref?.branchProtectionRule;
	if (
		!rule ||
		[
			"requiresStatusChecks",
			"requiresStrictStatusChecks",
			"isAdminEnforced",
			"allowsForcePushes",
			"allowsDeletions",
		].some((key) => typeof rule[key] !== "boolean") ||
		!Array.isArray(rule.requiredStatusChecks)
	)
		throw new Error("Branch protection inspection unavailable");
	return {
		required_status_checks: {
			enabled: rule.requiresStatusChecks,
			strict: rule.requiresStrictStatusChecks,
			checks: rule.requiredStatusChecks.map((check) => ({
				context: check.context,
				app_id: check.app?.databaseId ?? null,
			})),
		},
		enforce_admins: { enabled: rule.isAdminEnforced },
		allow_force_pushes: { enabled: rule.allowsForcePushes },
		allow_deletions: { enabled: rule.allowsDeletions },
	};
}

export async function inspectReadiness(api, enabled, policyReady) {
	try {
		return { status: "inspectable", protection: await readProtection(api) };
	} catch (error) {
		if (error.name !== "GitHubPermissionError" || enabled || policyReady)
			throw error;
		return {
			status: "blocked",
			reason: "workflow-token-cannot-inspect-protection",
			automation: "disabled",
		};
	}
}

export async function reconcile({
	api,
	repository,
	number,
	enabled,
	mutate = false,
}) {
	const root = `/repos/${repository}`;
	const pr = await api(`${root}/pulls/${number}`);
	if (pr.state !== "open") return "closed";
	let check;
	const disable = async () => {
		if (mutate && pr.auto_merge) {
			await api("/graphql", {
				query:
					"mutation($id:ID!){disablePullRequestAutoMerge(input:{pullRequestId:$id}){clientMutationId}}",
				variables: { id: pr.node_id },
			});
			pr.auto_merge = null;
		}
	};
	const finish = async (reason, success = true) => {
		if (check)
			await api(
				`${root}/check-runs/${check.id}`,
				{
					status: "completed",
					conclusion: success ? "success" : "failure",
					output: {
						title: reason,
						summary:
							"Automatic eligibility only; manual merges remain subject to repository review and Quality checks.",
					},
				},
				"PATCH",
			);
		return reason;
	};
	try {
		if (mutate)
			check = await api(`${root}/check-runs`, {
				name: POLICY_CHECK,
				head_sha: pr.head.sha,
				status: "in_progress",
				output: {
					title: "Evaluating dependency policy",
					summary: "No PR code is executed.",
				},
			});
		if (!isDependabot(pr.user)) return await finish("manual-author");
		// Revoke before reevaluation, including vetoes, base edits and modified bot PRs.
		await disable();
		const commits = await api(`${root}/pulls/${number}/commits?per_page=100`);
		const identity = identityReason(pr, repository, commits);
		if (identity) return await finish(identity);
		const files = await api(`${root}/pulls/${number}/files?per_page=100`);
		if (files.length !== pr.changed_files || files.length > 2)
			return await finish("incomplete-file-scope");
		const read = async (ref, path) => {
			if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error("invalid-revision");
			const tree = await api(`${root}/git/trees/${ref}`);
			const entry = tree.tree?.find((item) => item.path === path);
			if (tree.truncated || entry?.type !== "blob" || entry.mode !== "100644")
				throw new Error("unexpected-file-mode");
			const blob = await api(`${root}/git/blobs/${entry.sha}`);
			if (blob.encoding !== "base64" || blob.size > 1_000_000)
				throw new Error("unsupported-blob");
			return JSON.parse(Buffer.from(blob.content, "base64").toString("utf8"));
		};
		const [beforeManifest, afterManifest, beforeLock, afterLock] =
			await Promise.all([
				read(pr.base.sha, "package.json"),
				read(pr.head.sha, "package.json"),
				read(pr.base.sha, "package-lock.json"),
				read(pr.head.sha, "package-lock.json"),
			]);
		const decision = dependencyDecision({
			files,
			beforeManifest,
			afterManifest,
			beforeLock,
			afterLock,
		});
		if (!decision.eligible) return await finish(decision.reason);
		if (!enabled) return await finish("eligible-automation-paused");
		const [settings, protection, comparison, runs, branch] = await Promise.all([
			api(root),
			readProtection(api),
			api(`${root}/compare/${pr.base.sha}...${pr.head.sha}`),
			api(
				`${root}/actions/workflows/quality.yml/runs?head_sha=${pr.head.sha}&event=pull_request&per_page=100`,
			),
			api(`${root}/git/ref/heads/develop`),
		]);
		const quality = runs.workflow_runs?.[0];
		const jobs = quality
			? await api(
					`${root}/actions/runs/${quality.id}/jobs?filter=latest&per_page=100`,
				)
			: { jobs: [] };
		const fresh = await api(`${root}/pulls/${number}`);
		const reason =
			identityReason(fresh, repository, commits) ||
			gateReason({
				protection,
				repository: settings,
				pr: fresh,
				currentHead: pr.head.sha,
				currentBase: branch.object.sha,
				comparison,
				quality,
				jobs: jobs.jobs,
			});
		if (fresh.base.sha !== pr.base.sha || jobs.total_count > 100)
			return await finish("snapshot-changed");
		if (reason) return await finish(reason);
		if (!mutate) return "eligible-dry-run";
		// The required policy check stays pending while native auto-merge is armed.
		// GitHub then enforces all checks, approvals, conversations and strict freshness.
		await api("/graphql", {
			query:
				"mutation($id:ID!){enablePullRequestAutoMerge(input:{pullRequestId:$id,mergeMethod:SQUASH}){clientMutationId}}",
			variables: { id: pr.node_id },
		});
		pr.auto_merge = true;
		const final = await api(`${root}/pulls/${number}`);
		if (
			identityReason(final, repository, commits) ||
			final.head.sha !== pr.head.sha ||
			final.base.sha !== pr.base.sha
		) {
			await disable();
			return await finish("changed-before-arming");
		}
		return await finish("eligible-native-auto-merge-armed");
	} catch {
		// An API/permission/parsing error never leaves an effective automatic path.
		await disable();
		await finish("verification-unavailable-manual-review", false);
		throw new Error(
			"Dependency verification unavailable; inspect permissions and retry the trusted workflow.",
		);
	}
}

async function main() {
	const repository = process.env.GITHUB_REPOSITORY;
	if (repository !== "gonzalomartinperez/portfolio-assistant-web")
		throw new Error("Unexpected repository");
	const token = process.env.GH_TOKEN;
	if (!token) throw new Error("Missing API token");
	const api = async (path, body, method = body ? "POST" : "GET") => {
		const response = await fetch(`https://api.github.com${path}`, {
			method,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
			...(body ? { body: JSON.stringify(body) } : {}),
			signal: AbortSignal.timeout(20_000),
		});
		if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
		const value = await response.json();
		if (value.errors) {
			if (value.errors.some((error) => error.type === "FORBIDDEN")) {
				const denied = new Error(
					"GitHub token cannot inspect required protection",
				);
				denied.name = "GitHubPermissionError";
				throw denied;
			}
			throw new Error("GitHub GraphQL rejected operation");
		}
		return value;
	};
	if (process.env.DEPENDENCY_INSPECT === "true") {
		const result = await inspectReadiness(
			api,
			process.env.DEPENDABOT_AUTOMERGE === "true",
			process.env.DEPENDABOT_POLICY_READY === "true",
		);
		console.log(JSON.stringify(result));
		if (result.status === "blocked")
			console.log(
				"::warning::Dependency automation remains blocked and disabled: workflow-token protection access is unavailable.",
			);
		return;
	}

	const event = process.env.GITHUB_EVENT_PATH
		? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"))
		: {};
	const number = Number(
		process.env.PR_NUMBER ||
			event.pull_request?.number ||
			event.workflow_run?.pull_requests?.[0]?.number,
	);
	if (!Number.isSafeInteger(number) || number < 1) {
		console.log("No single PR to reconcile; no action.");
		return;
	}
	if (event.workflow_run && event.workflow_run.pull_requests.length !== 1)
		return;
	const reason = await reconcile({
		api,
		repository,
		number,
		enabled: process.env.DEPENDABOT_AUTOMERGE === "true",
		mutate: process.env.APPLY_DEPENDENCY_POLICY === "true",
	});
	console.log(`PR #${number}: ${reason}`);
}
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
