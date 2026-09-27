import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import yaml from "js-yaml";
import {
	dependencyDecision,
	gateReason,
	identityReason,
} from "../../scripts/dependency-policy.mjs";
import { reconcile } from "../../scripts/dependency-automation.mjs";
const repository = "gonzalomartinperez/portfolio-assistant-web";
const bot = { id: 49699333, login: "dependabot[bot]", type: "Bot" };
const head = "a".repeat(40);
const base = "b".repeat(40);
const entry = (name, version) => ({
	version,
	resolved: `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`,
	integrity: `sha512-${"A".repeat(86)}==`,
	dev: true,
});
function fixture() {
	const beforeManifest = {
		scripts: { test: "node --test" },
		devDependencies: { "@types/react": "19.3.0", "@types/node": "24.13.5" },
	};
	const afterManifest = structuredClone(beforeManifest);
	afterManifest.devDependencies["@types/react"] = "19.3.1";
	const lock = (manifest) => ({
		lockfileVersion: 3,
		packages: {
			"": { devDependencies: structuredClone(manifest.devDependencies) },
			...Object.fromEntries(
				Object.entries(manifest.devDependencies).map(([name, version]) => [
					`node_modules/${name}`,
					entry(name, version),
				]),
			),
		},
	});
	return {
		files: [
			{ filename: "package.json", status: "modified" },
			{ filename: "package-lock.json", status: "modified" },
		],
		beforeManifest,
		afterManifest,
		beforeLock: lock(beforeManifest),
		afterLock: lock(afterManifest),
	};
}
function identity() {
	const pr = {
		user: bot,
		node_id: "PR_fixture",
		state: "open",
		draft: false,
		labels: [],
		commits: 1,
		changed_files: 2,
		head: { sha: head, repo: { full_name: repository } },
		base: { sha: base, ref: "develop", repo: { full_name: repository } },
		mergeable: true,
		mergeable_state: "blocked",
		auto_merge: null,
	};
	const commits = [
		{
			sha: head,
			author: bot,
			committer: { id: 19864447, login: "web-flow" },
			commit: { verification: { verified: true, reason: "valid" } },
		},
	];
	return { pr, commits };
}
function gate() {
	return {
		protection: {
			required_status_checks: {
				enabled: true,
				strict: true,
				checks: [
					{ context: "checks" },
					{ context: "dependency-policy", app_id: 15368 },
				],
			},
			enforce_admins: { enabled: true },
			allow_force_pushes: { enabled: false },
			allow_deletions: { enabled: false },
		},
		repository: { allow_auto_merge: true, allow_squash_merge: true },
		pr: identity().pr,
		currentHead: head,
		currentBase: base,
		comparison: { status: "ahead", behind_by: 0, ahead_by: 1 },
		quality: {
			id: 42,
			head_sha: head,
			event: "pull_request",
			path: ".github/workflows/quality.yml",
			actor: bot,
			triggering_actor: bot,
			status: "completed",
			conclusion: "success",
		},
		jobs: ["static", "image", "browser", "live-fixture", "checks"].map(
			(name) => ({ name, status: "completed", conclusion: "success" }),
		),
	};
}
function setVersion(f, value) {
	f.afterManifest.devDependencies["@types/react"] = value;
	f.afterLock.packages[""].devDependencies["@types/react"] = value;
	f.afterLock.packages["node_modules/@types/react"] = entry(
		"@types/react",
		value,
	);
}
test("dependency policy allows bounded patch and explicitly covered minor", () => {
	const f = fixture();
	assert.equal(dependencyDecision(f).eligible, true);
	setVersion(f, "19.4.0");
	assert.equal(dependencyDecision(f).eligible, true);
});
test("major, prerelease, unknown, downgrade, unchanged and unstable versions require review", () => {
	for (const value of [
		"20.0.0",
		"19.4.0-beta.1",
		"latest",
		"19.2.9",
		"19.3.0",
		"0.4.1",
	]) {
		const f = fixture();
		setVersion(f, value);
		assert.equal(dependencyDecision(f).eligible, false, value);
	}
});
test("all grouped and transitive changes must qualify", () => {
	const f = fixture();
	f.afterManifest.devDependencies["@types/node"] = "25.0.0";
	assert.equal(dependencyDecision(f).eligible, false);
	const transitive = fixture();
	transitive.beforeLock.packages["node_modules/unknown"] = entry(
		"unknown",
		"1.0.0",
	);
	transitive.afterLock.packages["node_modules/unknown"] = entry(
		"unknown",
		"1.0.1",
	);
	assert.equal(dependencyDecision(transitive).eligible, false);
});
test("unexpected files, scripts, package hooks, sources and lock-only changes fail closed", () => {
	for (const mutate of [
		(f) =>
			f.files.push({
				filename: ".github/workflows/quality.yml",
				status: "modified",
			}),
		(f) => {
			f.afterManifest.scripts.test = "true";
		},
		(f) => {
			f.afterLock.packages["node_modules/@types/react"].hasInstallScript = true;
		},
		(f) => {
			f.afterLock.packages["node_modules/@types/react"].resolved =
				"https://example.com/package.tgz";
		},
		(f) => {
			f.afterLock.packages["node_modules/@types/react"].dependencies = {
				unexpected: "1.0.0",
			};
		},
		(f) => {
			f.afterManifest = f.beforeManifest;
		},
		(f) => {
			f.files[0].status = "renamed";
		},
	]) {
		const f = fixture();
		mutate(f);
		assert.equal(dependencyDecision(f).eligible, false);
	}
	assert.equal(dependencyDecision({}).eligible, false);
});
test("authenticated bot identity, signed single commit, repository and develop are mandatory", () => {
	const valid = identity();
	assert.equal(identityReason(valid.pr, repository, valid.commits), null);
	for (const mutate of [
		(f) => {
			f.pr.user = { ...bot, id: 123 };
			f.pr.title = "Bump @types/react";
			f.pr.labels = [{ name: "dependencies" }];
		},
		(f) => {
			f.pr.base.ref = "main";
		},
		(f) => {
			f.pr.head.repo.full_name = "attacker/fork";
		},
		(f) => {
			f.pr.labels = [{ name: "dependencies:manual" }];
		},
		(f) => {
			f.commits.push({ author: { login: "human" } });
		},
		(f) => {
			f.commits[0].author = { ...bot, id: 123 };
		},
		(f) => {
			f.commits[0].commit.verification.verified = false;
		},
		(f) => {
			f.pr.head.sha = "c".repeat(40);
		},
	]) {
		const f = identity();
		mutate(f);
		assert.notEqual(identityReason(f.pr, repository, f.commits), null);
	}
});
test("failed, missing, cancelled, skipped and pending verification cannot arm auto-merge", () => {
	assert.equal(gateReason(gate()), null);
	for (const state of ["failure", "cancelled", "skipped", null]) {
		const f = gate();
		f.quality.conclusion = state;
		assert.notEqual(gateReason(f), null);
		const job = gate();
		job.jobs[0].conclusion = state;
		assert.notEqual(gateReason(job), null);
	}
	const f = gate();
	f.jobs.pop();
	assert.notEqual(gateReason(f), null);
});
test("new heads, base advancement, conflicts and absent protection block arming", () => {
	for (const mutate of [
		(f) => {
			f.protection.required_status_checks.enabled = false;
		},
		(f) => {
			f.currentHead = "c".repeat(40);
		},
		(f) => {
			f.currentBase = "c".repeat(40);
		},
		(f) => {
			f.comparison.behind_by = 1;
		},
		(f) => {
			f.pr.mergeable = false;
		},
		(f) => {
			f.protection.required_status_checks.strict = false;
		},
		(f) => {
			f.protection.required_status_checks.checks.pop();
		},
		(f) => {
			f.protection.required_status_checks.checks[1].app_id = null;
		},
		(f) => {
			f.quality.triggering_actor = { login: "human" };
		},
		(f) => {
			f.quality.head_sha = "c".repeat(40);
		},
	]) {
		const f = gate();
		mutate(f);
		assert.notEqual(gateReason(f), null);
	}
});
function service({
	veto = false,
	race = false,
	broken = false,
	lateRace = false,
} = {}) {
	const f = fixture(),
		id = identity(),
		g = gate(),
		calls = [];
	id.pr.auto_merge = {};
	if (veto) id.pr.labels.push({ name: "dependencies:manual" });
	let reads = 0;
	const api = async (path, body) => {
		calls.push({ path, body });
		if (path.endsWith("/pulls/1")) {
			reads++;
			const pr = structuredClone(id.pr);
			if ((race && reads > 1) || (lateRace && reads > 2))
				pr.head.sha = "c".repeat(40);
			return pr;
		}
		if (path.endsWith("/check-runs")) return { id: 1 };
		if (path === "/graphql" && body.query.startsWith("query")) {
			if (broken) throw new Error("HTTP 403");
			return {
				data: {
					repository: {
						ref: {
							branchProtectionRule: {
								requiresStatusChecks: true,
								requiresStrictStatusChecks: true,
								isAdminEnforced: true,
								allowsForcePushes: false,
								allowsDeletions: false,
								requiredStatusChecks:
									g.protection.required_status_checks.checks.map((check) => ({
										context: check.context,
										app: check.app_id ? { databaseId: check.app_id } : null,
									})),
							},
						},
					},
				},
			};
		}
		if (path.endsWith("/check-runs/1") || path === "/graphql") return {};
		if (path.includes("/commits?")) return id.commits;
		if (path.includes("/files?")) return f.files;
		if (path.includes("/git/trees/"))
			return {
				tree: ["package.json", "package-lock.json"].map((name) => ({
					path: name,
					type: "blob",
					mode: "100644",
					sha: `${path.endsWith(base) ? "old" : "new"}-${name}`,
				})),
			};
		if (path.includes("/git/blobs/")) {
			const old = path.includes("old-"),
				lock = path.includes("package-lock");
			const data = lock
				? old
					? f.beforeLock
					: f.afterLock
				: old
					? f.beforeManifest
					: f.afterManifest;
			return {
				encoding: "base64",
				size: 100,
				content: Buffer.from(JSON.stringify(data)).toString("base64"),
			};
		}
		if (path.endsWith("/protection")) {
			if (broken) throw new Error("HTTP 403");
			return g.protection;
		}
		if (path.includes("/compare/")) return g.comparison;
		if (path.includes("/workflows/")) return { workflow_runs: [g.quality] };
		if (path.includes("/jobs?"))
			return { jobs: g.jobs, total_count: g.jobs.length };
		if (path.includes("/git/ref/")) return { object: { sha: base } };
		if (path === `/repos/${repository}`) return g.repository;
		throw new Error("Unexpected fixture API call");
	};
	return { api, calls };
}
test("controller revokes first, arms native auto-merge while policy pending, never approves or merges", async () => {
	const s = service();
	assert.equal(
		await reconcile({
			...s,
			repository,
			number: 1,
			enabled: true,
			mutate: true,
		}),
		"eligible-native-auto-merge-armed",
	);
	const writes = s.calls.filter(
		(call) => call.body && !call.body.query?.startsWith("query"),
	);
	assert.equal(writes[0].body.status, "in_progress");
	assert.match(writes[1].body.query, /disablePullRequestAutoMerge/);
	assert.match(writes[2].body.query, /enablePullRequestAutoMerge/);
	assert.equal(writes[3].body.conclusion, "success");
	assert.equal(
		writes.some((call) =>
			/approve|mergePullRequest/.test(call.body.query ?? ""),
		),
		false,
	);
});
test("controller veto, pause, head race and API failure never retain automatic eligibility", async () => {
	for (const options of [{ veto: true }, { race: true }, {}]) {
		const s = service(options);
		await reconcile({
			...s,
			repository,
			number: 1,
			enabled: !!(options.veto || options.race),
			mutate: true,
		});
		assert.equal(
			s.calls.some((call) =>
				call.body?.query?.includes("enablePullRequestAutoMerge"),
			),
			false,
		);
		assert.equal(
			s.calls.some((call) =>
				call.body?.query?.includes("disablePullRequestAutoMerge"),
			),
			true,
		);
	}
	const s = service({ broken: true });
	await assert.rejects(
		reconcile({ ...s, repository, number: 1, enabled: true, mutate: true }),
	);
	assert.equal(s.calls.at(-1).body.conclusion, "failure");
});
test("a head changed after arming revokes auto-merge before completing the old policy check", async () => {
	const s = service({ lateRace: true });
	assert.equal(
		await reconcile({
			...s,
			repository,
			number: 1,
			enabled: true,
			mutate: true,
		}),
		"changed-before-arming",
	);
	const mutations = s.calls.filter((call) =>
		call.body?.query?.startsWith("mutation"),
	);
	assert.equal(mutations.length, 3);
	assert.match(mutations[1].body.query, /enablePullRequestAutoMerge/);
	assert.match(mutations[2].body.query, /disablePullRequestAutoMerge/);
});
test("read-only invocation never writes, even when eligible", async () => {
	const s = service();
	assert.equal(
		await reconcile({ ...s, repository, number: 1, enabled: true }),
		"eligible-dry-run",
	);
	assert.equal(
		s.calls.some((call) => call.body && !call.body.query?.startsWith("query")),
		false,
	);
});
test("privileged workflow executes only default-branch policy with pinned actions and no installs", () => {
	const raw = readFileSync(
		new URL("../../.github/workflows/dependency-policy.yml", import.meta.url),
		"utf8",
	);
	const workflow = yaml.load(raw);
	assert.deepEqual(workflow.permissions, {});
	const steps = workflow.jobs.reconcile.steps;
	assert.equal(
		steps[0].with.ref,
		`\${{ github.event.repository.default_branch }}`,
	);
	assert.equal(steps[0].with["persist-credentials"], false);
	for (const step of steps)
		if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
	assert.equal(steps.filter((step) => step.run).length, 1);
	assert.equal(steps.at(-1).run, "node scripts/dependency-automation.mjs");
	assert.equal(raw.includes("secrets."), false);
	assert.equal(workflow.on.pull_request_target.paths, undefined);
});
