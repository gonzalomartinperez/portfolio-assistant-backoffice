import { field, record, list, text } from "./json.ts";
import { isDeepStrictEqual as equal } from "node:util";

export const POLICY_CHECK = "dependency-policy";
export const isDependabot = (user: unknown) =>
	field(user, "id") === 49699333 &&
	field(user, "login") === "dependabot[bot]" &&
	field(user, "type") === "Bot";
const approved = new Map([
	["@types/node", { major: 24, minor: false }],
	["@types/react", { major: 19, minor: true }],
	["@types/react-dom", { major: 19, minor: false }],
]);
const omit = (value: unknown, keys: readonly string[]) =>
	Object.fromEntries(
		Object.entries(record(value)).filter(([key]) => !keys.includes(key)),
	);
function version(value: unknown) {
	if (
		typeof value !== "string" ||
		!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)
	)
		return null;
	const [major, minor, patch] = value.split(".").map(Number);
	if (
		major === undefined ||
		minor === undefined ||
		patch === undefined ||
		![major, minor, patch].every(Number.isSafeInteger)
	)
		return null;
	return { major, minor, patch };
}
function allowedVersion(name: string, before: unknown, after: unknown) {
	const rule = approved.get(name);
	const a = version(before);
	const b = version(after);
	return !!(
		rule &&
		a &&
		b &&
		a.major > 0 &&
		a.major === rule.major &&
		b.major === a.major &&
		((b.minor === a.minor && b.patch > a.patch) ||
			(rule.minor && b.minor > a.minor))
	);
}

export function identityReason(
	pr: unknown,
	repository: string,
	commits: unknown,
): string | null {
	if (!isDependabot(field(pr, "user"))) return "not-authenticated-dependabot";
	if (
		field(pr, "base", "ref") !== "develop" ||
		field(pr, "base", "repo", "full_name") !== repository
	)
		return "wrong-target";
	if (field(pr, "head", "repo", "full_name") !== repository)
		return "foreign-source";
	if (field(pr, "state") !== "open" || field(pr, "draft") !== false)
		return "not-open-ready-pr";
	const labels = field(pr, "labels");
	if (!Array.isArray(labels)) return "incomplete-metadata";
	if (
		labels.some(
			(label: unknown) => field(label, "name") === "dependencies:manual",
		)
	)
		return "manual-veto";
	if (
		!Array.isArray(commits) ||
		commits.length !== 1 ||
		field(pr, "commits") !== 1
	)
		return "human-or-ambiguous-history";
	const commit: unknown = commits[0];
	if (
		field(commit, "sha") !== field(pr, "head", "sha") ||
		!isDependabot(field(commit, "author")) ||
		field(commit, "committer", "id") !== 19864447 ||
		field(commit, "committer", "login") !== "web-flow" ||
		field(commit, "commit", "verification", "verified") !== true ||
		field(commit, "commit", "verification", "reason") !== "valid"
	)
		return "unverified-bot-commit";
	return null;
}

type DependencyInput = {
	files?: unknown;
	beforeManifest?: unknown;
	afterManifest?: unknown;
	beforeLock?: unknown;
	afterLock?: unknown;
};
export type DependencyDecision =
	| { eligible: false; reason: string }
	| { eligible: true; reason: "approved-type-update"; dependencies: string[] };
export function dependencyDecision({
	files: rawFiles,
	beforeManifest,
	afterManifest,
	beforeLock,
	afterLock,
}: DependencyInput): DependencyDecision {
	const reject = (reason: string): DependencyDecision => ({
		eligible: false,
		reason,
	});
	try {
		const files = list(rawFiles).map(record);
		if (
			files.length < 1 ||
			files.length > 2 ||
			files.some(
				(file) =>
					!["package.json", "package-lock.json"].includes(
						text(file.filename),
					) ||
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
		const a = record(field(beforeManifest, "devDependencies"));
		const b = record(field(afterManifest, "devDependencies"));
		if (!equal(Object.keys(a).sort(), Object.keys(b).sort()))
			return reject("dependency-added-or-removed");
		const manifestChanges = Object.keys(a).filter(
			(name) => a[name] !== b[name],
		);
		if (manifestChanges.some((name) => !allowedVersion(name, a[name], b[name])))
			return reject("manifest-version-not-approved");
		if (
			field(beforeLock, "lockfileVersion") !== 3 ||
			field(afterLock, "lockfileVersion") !== 3 ||
			!equal(omit(beforeLock, ["packages"]), omit(afterLock, ["packages"]))
		)
			return reject("unknown-lockfile-format");
		const oldPackages = record(field(beforeLock, "packages"));
		const newPackages = record(field(afterLock, "packages"));
		if (
			!equal(Object.keys(oldPackages).sort(), Object.keys(newPackages).sort())
		)
			return reject("lock-graph-added-or-removed");
		if (
			!equal(
				omit(oldPackages[""], ["devDependencies"]),
				omit(newPackages[""], ["devDependencies"]),
			) ||
			!equal(field(oldPackages[""], "devDependencies"), a) ||
			!equal(field(newPackages[""], "devDependencies"), b)
		)
			return reject("lock-root-mismatch");
		const changed: string[] = [];
		for (const [path, value] of Object.entries(newPackages)) {
			if (!path) continue;
			const previous = record(oldPackages[path]);
			const next = record(value);
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
				!/^sha512-[A-Za-z0-9+/]{86}==$/.test(text(next.integrity))
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

export type GateInput = {
	protection: unknown;
	repository: unknown;
	pr: unknown;
	currentHead: string;
	currentBase: string;
	comparison: unknown;
	quality: unknown;
	jobs: unknown;
};
export function gateReason({
	protection,
	repository,
	pr,
	currentHead,
	currentBase,
	comparison,
	quality,
	jobs,
}: GateInput): string | null {
	const checks = field(protection, "required_status_checks");
	const required = field(checks, "checks");
	if (
		field(repository, "allow_auto_merge") !== true ||
		field(repository, "allow_squash_merge") !== true ||
		field(checks, "enabled") !== true ||
		field(checks, "strict") !== true ||
		field(protection, "enforce_admins", "enabled") !== true ||
		field(protection, "allow_force_pushes", "enabled") !== false ||
		field(protection, "allow_deletions", "enabled") !== false ||
		!Array.isArray(required) ||
		!required.some((check: unknown) => field(check, "context") === "checks") ||
		!required.some(
			(check: unknown) =>
				field(check, "context") === POLICY_CHECK &&
				field(check, "app_id") === 15368,
		)
	)
		return "essential-protection-missing";
	if (
		field(pr, "head", "sha") !== currentHead ||
		field(pr, "base", "sha") !== currentBase
	)
		return "revision-changed";
	if (
		field(comparison, "behind_by") !== 0 ||
		field(comparison, "status") !== "ahead" ||
		field(comparison, "ahead_by") !== 1
	)
		return "branch-not-current";
	if (
		field(pr, "mergeable") !== true ||
		field(pr, "mergeable_state") === "dirty"
	)
		return "conflict-or-unknown-mergeability";
	if (
		field(quality, "head_sha") !== currentHead ||
		field(quality, "event") !== "pull_request" ||
		field(quality, "path") !== ".github/workflows/quality.yml" ||
		!isDependabot(field(quality, "actor")) ||
		!isDependabot(field(quality, "triggering_actor")) ||
		field(quality, "status") !== "completed" ||
		field(quality, "conclusion") !== "success"
	)
		return "quality-not-current-success";
	if (
		!Array.isArray(jobs) ||
		!["static", "image", "browser", "live-fixture", "checks"].every((name) =>
			jobs.some(
				(job: unknown) =>
					field(job, "name") === name &&
					field(job, "status") === "completed" &&
					field(job, "conclusion") === "success",
			),
		)
	)
		return "required-job-not-success";
	return null;
}
