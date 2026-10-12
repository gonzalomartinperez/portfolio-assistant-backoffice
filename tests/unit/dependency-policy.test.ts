import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "js-yaml";
import type { GitHubApi } from "../../scripts/dependency-automation.ts";
import {
	inspectReadiness,
	reconcile,
} from "../../scripts/dependency-automation.ts";
import {
	dependencyDecision,
	gateReason,
	identityReason,
} from "../../scripts/dependency-policy.ts";
import { field, list, record, text } from "../../scripts/json.ts";

const repository = "gonzalomartinperez/portfolio-assistant-web";
const bot = { id: 49699333, login: "dependabot[bot]", type: "Bot" };
const head = "a".repeat(40);
const base = "b".repeat(40);
function first<T>(values: readonly T[]): T {
	const value = values[0];
	assert.ok(value !== undefined);
	return value;
}
type Lock = { lockfileVersion: number; packages: Record<string, unknown> };
type Call = { path: string; body: Record<string, unknown> | undefined };
function query(call: Call): string {
	return typeof call.body?.query === "string" ? call.body.query : "";
}
const entry = (name: string, version: string) => ({
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
	const lock = (manifest: typeof beforeManifest): Lock => ({
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
	const labels: { name: string }[] = [];
	const pr = {
		user: bot,
		node_id: "PR_fixture",
		state: "open",
		draft: false,
		labels,
		commits: 1,
		changed_files: 2,
		head: { sha: head, repo: { full_name: repository } },
		base: { sha: base, ref: "develop", repo: { full_name: repository } },
		mergeable: true,
		mergeable_state: "blocked",
		auto_merge: {},
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
function setVersion(f: ReturnType<typeof fixture>, value: string) {
	f.afterManifest.devDependencies["@types/react"] = value;
	record(record(f.afterLock.packages[""]).devDependencies)["@types/react"] =
		value;
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
		(f: ReturnType<typeof fixture>) =>
			f.files.push({
				filename: ".github/workflows/quality.yml",
				status: "modified",
			}),
		(f: ReturnType<typeof fixture>) => {
			f.afterManifest.scripts.test = "true";
		},
		(f: ReturnType<typeof fixture>) => {
			record(
				f.afterLock.packages["node_modules/@types/react"],
			).hasInstallScript = true;
		},
		(f: ReturnType<typeof fixture>) => {
			record(f.afterLock.packages["node_modules/@types/react"]).resolved =
				"https://example.com/package.tgz";
		},
		(f: ReturnType<typeof fixture>) => {
			record(f.afterLock.packages["node_modules/@types/react"]).dependencies = {
				unexpected: "1.0.0",
			};
		},
		(f: ReturnType<typeof fixture>) => {
			f.afterManifest = f.beforeManifest;
		},
		(f: ReturnType<typeof fixture>) => {
			record(f.files[0]).status = "renamed";
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
		(f: ReturnType<typeof identity>) => {
			Reflect.deleteProperty(f.pr, "labels");
		},
		(f: ReturnType<typeof identity>) => {
			Reflect.deleteProperty(f.pr, "draft");
		},
		(f: ReturnType<typeof identity>) => {
			f.pr.user = { ...bot, id: 123 };
			Object.assign(f.pr, { title: "Bump @types/react" });
			f.pr.labels = [{ name: "dependencies" }];
		},
		(f: ReturnType<typeof identity>) => {
			f.pr.base.ref = "main";
		},
		(f: ReturnType<typeof identity>) => {
			f.pr.head.repo.full_name = "attacker/fork";
		},
		(f: ReturnType<typeof identity>) => {
			f.pr.labels = [{ name: "dependencies:manual" }];
		},
		(f: ReturnType<typeof identity>) => {
			f.commits.push({
				...first(f.commits),
				author: { ...bot, id: 123, login: "human" },
			});
		},
		(f: ReturnType<typeof identity>) => {
			first(f.commits).author = { ...bot, id: 123 };
		},
		(f: ReturnType<typeof identity>) => {
			first(f.commits).commit.verification.verified = false;
		},
		(f: ReturnType<typeof identity>) => {
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
		assert.notEqual(
			gateReason({ ...f, quality: { ...f.quality, conclusion: state } }),
			null,
		);
		const job = gate();
		assert.notEqual(
			gateReason({
				...job,
				jobs: [{ ...first(job.jobs), conclusion: state }, ...job.jobs.slice(1)],
			}),
			null,
		);
	}
	const f = gate();
	f.jobs.pop();
	assert.notEqual(gateReason(f), null);
});
test("new heads, base advancement, conflicts and absent protection block arming", () => {
	for (const mutate of [
		(f: ReturnType<typeof gate>) => {
			f.protection.required_status_checks.enabled = false;
		},
		(f: ReturnType<typeof gate>) => {
			f.currentHead = "c".repeat(40);
		},
		(f: ReturnType<typeof gate>) => {
			f.currentBase = "c".repeat(40);
		},
		(f: ReturnType<typeof gate>) => {
			f.comparison.behind_by = 1;
		},
		(f: ReturnType<typeof gate>) => {
			f.pr.mergeable = false;
		},
		(f: ReturnType<typeof gate>) => {
			f.protection.required_status_checks.strict = false;
		},
		(f: ReturnType<typeof gate>) => {
			f.protection.required_status_checks.checks.pop();
		},
		(f: ReturnType<typeof gate>) => {
			record(f.protection.required_status_checks.checks[1]).app_id = null;
		},
		(f: ReturnType<typeof gate>) => {
			f.quality.triggering_actor = { ...bot, login: "human" };
		},
		(f: ReturnType<typeof gate>) => {
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
		calls: Call[] = [];
	id.pr.auto_merge = {};
	if (veto) id.pr.labels.push({ name: "dependencies:manual" });
	let reads = 0;
	const api: GitHubApi = async (path, body) => {
		calls.push({ path, body: body === undefined ? undefined : record(body) });
		if (path.endsWith("/pulls/1")) {
			reads++;
			const pr = structuredClone(id.pr);
			if ((race && reads > 1) || (lateRace && reads > 2))
				pr.head.sha = "c".repeat(40);
			return pr;
		}
		if (path.endsWith("/check-runs")) return { id: 1 };
		if (
			path === "/graphql" &&
			typeof field(body, "query") === "string" &&
			text(field(body, "query")).startsWith("query")
		) {
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
		(call) => call.body && !query(call).startsWith("query"),
	);
	assert.equal(field(writes[0]?.body, "status"), "in_progress");
	assert.match(
		text(field(writes[1]?.body, "query")),
		/disablePullRequestAutoMerge/,
	);
	assert.match(
		text(field(writes[2]?.body, "query")),
		/enablePullRequestAutoMerge/,
	);
	assert.equal(field(writes[3]?.body, "conclusion"), "success");
	assert.equal(
		writes.some((call) => /approve|mergePullRequest/.test(query(call))),
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
				query(call).includes("enablePullRequestAutoMerge"),
			),
			false,
		);
		assert.equal(
			s.calls.some((call) =>
				query(call).includes("disablePullRequestAutoMerge"),
			),
			true,
		);
	}
	const s = service({ broken: true });
	await assert.rejects(
		reconcile({ ...s, repository, number: 1, enabled: true, mutate: true }),
	);
	assert.equal(s.calls.at(-1)?.body?.conclusion, "failure");
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
		query(call).startsWith("mutation"),
	);
	assert.equal(mutations.length, 3);
	assert.match(
		text(field(mutations[1]?.body, "query")),
		/enablePullRequestAutoMerge/,
	);
	assert.match(
		text(field(mutations[2]?.body, "query")),
		/disablePullRequestAutoMerge/,
	);
});
test("read-only invocation never writes, even when eligible", async () => {
	const s = service();
	assert.equal(
		await reconcile({ ...s, repository, number: 1, enabled: true }),
		"eligible-dry-run",
	);
	assert.equal(
		s.calls.some((call) => call.body && !query(call).startsWith("query")),
		false,
	);
});
test("privileged workflow executes only default-branch policy with pinned actions and no installs", () => {
	const raw = readFileSync(
		new URL("../../.github/workflows/dependency-policy.yml", import.meta.url),
		"utf8",
	);
	const workflow = record(load(raw));
	assert.deepEqual(workflow.permissions, {});
	const steps = list(field(workflow, "jobs", "reconcile", "steps")).map(record);
	assert.equal(
		field(steps[0], "with", "ref"),
		`\${{ github.event.repository.default_branch }}`,
	);
	assert.equal(field(steps[0], "with", "persist-credentials"), false);
	assert.equal(
		field(steps[0], "with", "allow-unsafe-pr-checkout") ?? false,
		false,
	);
	assert.equal(field(steps[1], "with", "package-manager-cache"), false);
	for (const step of steps)
		if (step.uses) assert.match(text(step.uses), /@[a-f0-9]{40}$/);
	assert.equal(steps.filter((step) => step.run).length, 1);
	assert.equal(steps.at(-1)?.run, "node scripts/dependency-automation.ts");
	assert.equal(raw.includes("secrets."), false);
	assert.equal(
		field(workflow, "on", "pull_request_target", "paths"),
		undefined,
	);
});

test("unavailable token capability is safe only with both activation switches disabled", async () => {
	const denied = async () => {
		const error = new Error("denied");
		error.name = "GitHubPermissionError";
		throw error;
	};
	assert.equal(
		(await inspectReadiness(denied, false, false)).status,
		"blocked",
	);
	await assert.rejects(inspectReadiness(denied, true, false));
	await assert.rejects(inspectReadiness(denied, false, true));
	await assert.rejects(
		inspectReadiness(
			async () => {
				throw new Error("network failure");
			},
			false,
			false,
		),
	);
});

test("contract generator compiler-major proposals respect the isolated API compatibility boundary", () => {
	const config = record(load(readFileSync(".github/dependabot.yml", "utf8")));
	const generator = list(field(config, "updates")).find(
		(update) =>
			text(field(record(update), "directory")) === "/tooling/api-contract",
	);
	assert.ok(generator);
	const ignored = list(field(record(generator), "ignore"));
	const compiler = ignored.find(
		(entry) => text(field(record(entry), "dependency-name")) === "typescript",
	);
	assert.ok(compiler);
	assert.deepEqual(list(field(record(compiler), "update-types")), [
		"version-update:semver-major",
	]);
	assert.equal(text(field(record(generator), "target-branch")), "develop");
});
