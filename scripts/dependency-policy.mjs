import { isDeepStrictEqual as equal } from "node:util";

export const POLICY_CHECK = "dependency-policy";
export const isDependabot = (user) =>
	user?.id === 49699333 &&
	user.login === "dependabot[bot]" &&
	user.type === "Bot";
const approved = new Map([
	["@types/node", { major: 24, minor: false }],
	["@types/react", { major: 19, minor: true }],
	["@types/react-dom", { major: 19, minor: false }],
]);
const omit = (value, keys) =>
	Object.fromEntries(
		Object.entries(value).filter(([key]) => !keys.includes(key)),
	);
const version = (value) =>
	typeof value === "string" &&
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)
		? value.split(".").map(Number)
		: null;
function allowedVersion(name, before, after) {
	const rule = approved.get(name);
	const a = version(before);
	const b = version(after);
	return !!(
		rule &&
		a &&
		b &&
		a[0] > 0 &&
		a[0] === rule.major &&
		b[0] === a[0] &&
		((b[1] === a[1] && b[2] > a[2]) || (rule.minor && b[1] > a[1]))
	);
}

export function identityReason(pr, repository, commits) {
	if (!isDependabot(pr.user)) return "not-authenticated-dependabot";
	if (pr.base?.ref !== "develop" || pr.base?.repo?.full_name !== repository)
		return "wrong-target";
	if (pr.head?.repo?.full_name !== repository) return "foreign-source";
	if (pr.state !== "open" || pr.draft !== false) return "not-open-ready-pr";
	if (!Array.isArray(pr.labels)) return "incomplete-metadata";
	if (pr.labels.some((label) => label.name === "dependencies:manual"))
		return "manual-veto";
	if (commits.length !== 1 || pr.commits !== 1)
		return "human-or-ambiguous-history";
	const commit = commits[0];
	if (
		commit.sha !== pr.head.sha ||
		!isDependabot(commit.author) ||
		commit.committer?.id !== 19864447 ||
		commit.committer.login !== "web-flow" ||
		commit.commit?.verification?.verified !== true ||
		commit.commit.verification.reason !== "valid"
	)
		return "unverified-bot-commit";
	return null;
}

export function dependencyDecision({
	files,
	beforeManifest,
	afterManifest,
	beforeLock,
	afterLock,
}) {
	const reject = (reason) => ({ eligible: false, reason });
	try {
		if (
			files.length < 1 ||
			files.length > 2 ||
			files.some(
				(file) =>
					!["package.json", "package-lock.json"].includes(file.filename) ||
					file.status !== "modified" ||
					file.previous_filename,
			)
		)
			return reject("unexpected-file-scope");
		if (!files.some((file) => file.filename === "package-lock.json"))
			return reject("missing-lockfile");
		if (
			!equal(
				omit(beforeManifest, ["devDependencies"]),
				omit(afterManifest, ["devDependencies"]),
			)
		)
			return reject("manifest-behavior-changed");
		const a = beforeManifest.devDependencies;
		const b = afterManifest.devDependencies;
		if (!equal(Object.keys(a).sort(), Object.keys(b).sort()))
			return reject("dependency-added-or-removed");
		const manifestChanges = Object.keys(a).filter(
			(name) => a[name] !== b[name],
		);
		if (manifestChanges.some((name) => !allowedVersion(name, a[name], b[name])))
			return reject("manifest-version-not-approved");
		if (
			beforeLock.lockfileVersion !== 3 ||
			afterLock.lockfileVersion !== 3 ||
			!equal(omit(beforeLock, ["packages"]), omit(afterLock, ["packages"]))
		)
			return reject("unknown-lockfile-format");
		const oldPackages = beforeLock.packages;
		const newPackages = afterLock.packages;
		if (
			!equal(Object.keys(oldPackages).sort(), Object.keys(newPackages).sort())
		)
			return reject("lock-graph-added-or-removed");
		if (
			!equal(
				omit(oldPackages[""], ["devDependencies"]),
				omit(newPackages[""], ["devDependencies"]),
			) ||
			!equal(oldPackages[""].devDependencies, a) ||
			!equal(newPackages[""].devDependencies, b)
		)
			return reject("lock-root-mismatch");
		const changed = [];
		for (const [path, next] of Object.entries(newPackages)) {
			if (!path) continue;
			const previous = oldPackages[path];
			if (equal(previous, next)) continue;
			const name = path.replace(/^node_modules\//, "");
			if (
				!approved.has(name) ||
				!allowedVersion(name, previous.version, next.version)
			)
				return reject("lock-impact-not-approved");
			if (
				!equal(
					omit(previous, ["version", "resolved", "integrity"]),
					omit(next, ["version", "resolved", "integrity"]),
				) ||
				next.hasInstallScript ||
				next.link ||
				next.dev !== true
			)
				return reject("package-behavior-changed");
			const tarball = `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${next.version}.tgz`;
			if (
				next.resolved !== tarball ||
				!/^sha512-[A-Za-z0-9+/]{86}==$/.test(next.integrity)
			)
				return reject("untrusted-package-source");
			if (b[name] !== next.version)
				return reject("manifest-lock-version-mismatch");
			changed.push(name);
		}
		if (!changed.length || !equal(changed.sort(), manifestChanges.sort()))
			return reject("ambiguous-or-lock-only-update");
		return {
			eligible: true,
			reason: "approved-type-update",
			dependencies: changed,
		};
	} catch {
		return reject("malformed-metadata");
	}
}

export function gateReason({
	protection,
	repository,
	pr,
	currentHead,
	currentBase,
	comparison,
	quality,
	jobs,
}) {
	const checks = protection?.required_status_checks;
	if (
		!repository.allow_auto_merge ||
		!repository.allow_squash_merge ||
		checks?.enabled !== true ||
		!checks.strict ||
		!protection.enforce_admins?.enabled ||
		protection.allow_force_pushes?.enabled ||
		protection.allow_deletions?.enabled ||
		!checks.checks?.some((check) => check.context === "checks") ||
		!checks.checks?.some(
			(check) => check.context === POLICY_CHECK && check.app_id === 15368,
		)
	)
		return "essential-protection-missing";
	if (pr.head.sha !== currentHead || pr.base.sha !== currentBase)
		return "revision-changed";
	if (
		comparison.behind_by !== 0 ||
		comparison.status !== "ahead" ||
		comparison.ahead_by !== 1
	)
		return "branch-not-current";
	if (pr.mergeable !== true || pr.mergeable_state === "dirty")
		return "conflict-or-unknown-mergeability";
	if (
		!quality ||
		quality.head_sha !== currentHead ||
		quality.event !== "pull_request" ||
		quality.path !== ".github/workflows/quality.yml" ||
		!isDependabot(quality.actor) ||
		!isDependabot(quality.triggering_actor) ||
		quality.status !== "completed" ||
		quality.conclusion !== "success"
	)
		return "quality-not-current-success";
	if (
		!["static", "image", "browser", "live-fixture", "checks"].every((name) =>
			jobs.some(
				(job) =>
					job.name === name &&
					job.status === "completed" &&
					job.conclusion === "success",
			),
		)
	)
		return "required-job-not-success";
	return null;
}
