import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { requireCiSuccess } from "../../scripts/check-ci-results.ts";
import { releaseCompatibility } from "../../scripts/release-compatibility.ts";

const commit = "a".repeat(40);
const source = { api_commit: "b".repeat(40), openapi_sha256: "c".repeat(64) };
const operations = {
	api_commit: "e".repeat(40),
	operations_schema_json_sha256: "f".repeat(64),
};
const image = `ghcr.io/owner/portfolio-backoffice@sha256:${"d".repeat(64)}`;

test("records immutable image and both contract pins without claiming deployed compatibility", () => {
	const release = releaseCompatibility(commit, image, source, operations);
	assert.equal(release.backoffice_commit, commit);
	assert.equal(release.historical_public_api_commit, source.api_commit);
	assert.equal(release.operational_api_commit, operations.api_commit);
	assert.equal(
		release.operational_api_contract_sha256,
		operations.operations_schema_json_sha256,
	);
	assert.equal(release.schema_version, 2);
	assert.equal(release.backoffice_image, image);
	assert.equal(release.production_deployment, "disabled");
});

test("rejects mutable tags and unverifiable revisions or provenance", () => {
	for (const invalid of [
		image.replace("@sha256:", ":"),
		"ghcr.io/owner/web:latest",
		"",
	])
		assert.throws(() =>
			releaseCompatibility(commit, invalid, source, operations),
		);
	assert.throws(() =>
		releaseCompatibility("develop", image, source, operations),
	);
	for (const invalid of [
		null,
		{},
		{ ...source, api_commit: "main" },
		{ ...source, openapi_sha256: "missing" },
	])
		assert.throws(() =>
			releaseCompatibility(commit, image, invalid, operations),
		);
	assert.throws(() => releaseCompatibility(commit, image, source, {}));
	assert.throws(() =>
		releaseCompatibility(commit, image, source, {
			...operations,
			api_commit: "develop",
		}),
	);
});

test("required quality gate covers the full graph and publication stays explicit", async () => {
	const { readFileSync } = await import("node:fs");
	const { load } = await import("js-yaml");
	const { field, list, record, text } = await import("../../scripts/json.ts");
	const quality = record(
		load(readFileSync(".github/workflows/quality.yml", "utf8")),
	);
	const jobs = record(quality.jobs);
	const browserSteps = field(jobs, "browser", "steps");
	assert.ok(Array.isArray(browserSteps));
	assert.ok(
		browserSteps.some(
			(step: unknown) =>
				typeof field(step, "run") === "string" &&
				text(field(step, "run")).includes(
					"npx --no-install playwright install --with-deps --only-shell chromium firefox webkit",
				),
		),
	);
	assert.deepEqual(Object.keys(jobs).sort(), ["browser", "checks", "static"]);
	assert.deepEqual(field(jobs, "checks", "needs"), ["static", "browser"]);
	assert.equal(field(jobs, "checks", "if"), "always()");
	const gate = list(field(jobs, "checks", "steps")).find(
		(step) => field(step, "name") === "Require every validation job",
	);
	assert.equal(field(gate, "run"), "node scripts/check-ci-results.ts");
	assert.equal(field(quality, "on", "pull_request", "paths"), undefined);
	assert.deepEqual(quality.permissions, { contents: "read" });
	assert.equal(field(quality, "env", "DOCKER_BUILD_RECORD_UPLOAD"), "false");
	assert.equal(field(jobs, "browser", "needs"), undefined);
	assert.ok(
		browserSteps.some((step: unknown) =>
			String(field(step, "uses")).startsWith("docker/build-push-action@"),
		),
	);
	assert.ok(
		browserSteps.some((step: unknown) =>
			String(field(step, "run")).includes("--severity HIGH,CRITICAL"),
		),
	);
	const uploads = browserSteps.filter((step: unknown) =>
		String(field(step, "uses")).startsWith("actions/upload-artifact@"),
	);
	assert.equal(uploads.length, 1);
	const upload = record(uploads[0]);
	assert.equal(
		upload.uses,
		"actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9",
	);
	assert.equal(upload.if, "always()");
	assert.deepEqual(upload.with, {
		name: "backoffice-ui-screenshots",
		path: "test-results/**/*.png",
		"retention-days": 7,
		"if-no-files-found": "ignore",
	});

	const release = record(
		load(readFileSync(".github/workflows/release.yml", "utf8")),
	);
	assert.deepEqual(Object.keys(record(release.on)), ["workflow_dispatch"]);
	assert.equal(
		field(
			release,
			"on",
			"workflow_dispatch",
			"inputs",
			"publication_authorized",
			"default",
		),
		false,
	);
	assert.equal(
		field(release, "jobs", "publish", "environment"),
		"container-release",
	);
	assert.match(
		text(field(release, "jobs", "verify", "if")),
		/refs\/heads\/develop/,
	);
	assert.equal(field(release, "jobs", "publish", "if"), "${{ false }}");
	assert.equal(
		field(release, "jobs", "publish", "permissions", "packages"),
		undefined,
	);
	for (const workflow of [quality, release]) {
		for (const job of Object.values(record(workflow.jobs))) {
			if (field(job, "runs-on") !== undefined)
				assert.equal(field(job, "runs-on"), "ubuntu-24.04");
			const steps = field(job, "steps");
			if (steps === undefined) continue;
			for (const step of list(steps)) {
				const action = field(step, "uses");
				if (typeof action === "string") assert.match(action, /@[a-f0-9]{40}$/);
			}
		}
	}
});

test("required gate fails closed for missing, failed, pending or skipped results", () => {
	const success = {
		static: { result: "success" },
		browser: { result: "success" },
	};
	assert.doesNotThrow(() => requireCiSuccess(success));
	for (const result of [
		"failure",
		"cancelled",
		"skipped",
		"pending",
		"in_progress",
		undefined,
	])
		assert.throws(() => requireCiSuccess({ ...success, browser: { result } }));
	assert.throws(() => requireCiSuccess({ static: success.static }));
	for (const invalid of [null, [], "success", {}])
		assert.throws(() => requireCiSuccess(invalid));
});

test("parallel browser prerequisites wait for both children and fail on either error", async () => {
	const { readFileSync } = await import("node:fs");
	const { load } = await import("js-yaml");
	const { field, list, text } = await import("../../scripts/json.ts");
	const workflow = load(readFileSync(".github/workflows/quality.yml", "utf8"));
	const step = list(field(workflow, "jobs", "browser", "steps")).find(
		(value) =>
			field(value, "name") ===
			"Verify database authorization and prepare browsers independently",
	);
	const run = text(field(step, "run"));
	for (const [authorization, browsers] of [
		[0, 0],
		[1, 0],
		[0, 1],
		[1, 1],
	]) {
		const result = spawnSync(
			"bash",
			[
				"-e",
				"-c",
				`node(){ return ${authorization}; }; npx(){ return ${browsers}; };\n${run}`,
			],
			{ encoding: "utf8" },
		);
		assert.equal(result.status, authorization === 0 && browsers === 0 ? 0 : 1);
	}
});
