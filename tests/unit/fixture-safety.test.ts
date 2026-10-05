import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fixtureSession } from "../../scripts/auth-fixture-session.ts";

test("destructive integration rejects remote and malformed configuration before connecting", () => {
	for (const databaseUrl of [
		"postgres://fixture:fixture-redaction-probe@shared.invalid/backoffice_test",
		"invalid-fixture-redaction-probe",
	]) {
		const fixtureEnvironment: NodeJS.ProcessEnv = {
			...process.env,
			BACKOFFICE_DATABASE_URL: databaseUrl,
		};
		// A nested runner marker would skip executing the safety probe.
		delete fixtureEnvironment.NODE_TEST_CONTEXT;
		const result = spawnSync(
			process.execPath,
			["--test", "tests/integration/auth.test.ts"],
			{
				env: fixtureEnvironment,
				encoding: "utf8",
				timeout: 5000,
			},
		);
		assert.equal(result.status, 1);
		assert.match(result.stdout + result.stderr, /isolated|loopback/);
		assert.doesNotMatch(
			result.stdout + result.stderr,
			/fixture-redaction-probe/,
		);
	}
});

test("fixture session provisioning refuses a remote database", async () => {
	await assert.rejects(
		fixtureSession("owner", {
			origin: "http://localhost:3107",
			databaseUrl: "postgres://fixture:fixture@shared.invalid/backoffice_test",
			secret: "fixture-only-secret-at-least-32-characters",
			ownerEmail: "owner@example.test",
			google: { clientId: "fixture", clientSecret: "fixture" },
			github: { clientId: "fixture", clientSecret: "fixture" },
		}),
		/loopback origin\/database/,
	);
});
