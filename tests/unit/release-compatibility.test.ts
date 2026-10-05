import assert from "node:assert/strict";
import test from "node:test";
import { requireCiSuccess } from "../../scripts/check-ci-results.ts";
import { releaseCompatibility } from "../../scripts/release-compatibility.ts";

const commit = "a".repeat(40);
const source = { api_commit: "b".repeat(40), openapi_sha256: "c".repeat(64) };
const image = `ghcr.io/owner/portfolio-assistant-backoffice@sha256:${"d".repeat(64)}`;

test("records immutable image and historical provenance without claiming operational compatibility", () => {
	const release = releaseCompatibility(commit, image, source);
	assert.equal(release.backoffice_commit, commit);
	assert.equal(release.historical_public_api_commit, source.api_commit);
	assert.equal(release.operational_api_commit, null);
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
		assert.throws(() => releaseCompatibility(commit, invalid, source));
	assert.throws(() => releaseCompatibility("develop", image, source));
	for (const invalid of [
		null,
		{},
		{ ...source, api_commit: "main" },
		{ ...source, openapi_sha256: "missing" },
	])
		assert.throws(() => releaseCompatibility(commit, image, invalid));
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
				field(step, "run") ===
				"npx --no-install playwright install --with-deps --only-shell chromium firefox webkit",
		),
	);
	assert.deepEqual(Object.keys(jobs).sort(), [
		"browser",
		"checks",
		"image",
		"static",
	]);
	assert.deepEqual(field(jobs, "checks", "needs"), [
		"static",
		"image",
		"browser",
	]);
	assert.equal(field(jobs, "checks", "if"), "always()");
	const gate = list(field(jobs, "checks", "steps")).find(
		(step) => field(step, "name") === "Require every validation job",
	);
	assert.equal(field(gate, "run"), "node scripts/check-ci-results.ts");
	assert.equal(field(quality, "on", "pull_request", "paths"), undefined);
	assert.deepEqual(quality.permissions, { contents: "read" });
	assert.equal(field(jobs, "browser", "needs"), "image");
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
	for (const workflow of [quality, release]) {
		for (const job of Object.values(record(workflow.jobs))) {
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
		image: { result: "success" },
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
	assert.throws(() =>
		requireCiSuccess({ static: success.static, image: success.image }),
	);
	for (const invalid of [null, [], "success", {}])
		assert.throws(() => requireCiSuccess(invalid));
});
