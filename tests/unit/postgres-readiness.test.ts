import assert from "node:assert/strict";
import test from "node:test";
import { waitForPostgres } from "../../scripts/postgres-readiness.ts";

test("SQL readiness waits through bootstrap rejection and a missing target database", async () => {
	let calls = 0;
	let pauses = 0;
	await waitForPostgres(
		() => {
			calls++;
			if (calls === 1)
				throw new Error("TCP connection refused during initialization");
			if (calls === 2) throw new Error("Target database does not exist yet");
			return "1";
		},
		async () => {
			pauses++;
		},
		3,
	);
	assert.equal(calls, 3);
	assert.equal(pauses, 2);
});

test("a ready SQL connection proceeds immediately", async () => {
	let pauses = 0;
	await waitForPostgres(
		() => "1",
		async () => {
			pauses++;
		},
	);
	assert.equal(pauses, 0);
});

test("unavailable or invalid SQL probes fail within the bound without exposing diagnostics", async () => {
	for (const fails of [true, false]) {
		let calls = 0;
		let pauses = 0;
		await assert.rejects(
			waitForPostgres(
				() => {
					calls++;
					if (fails) throw new Error("private connection sentinel");
					return "";
				},
				async () => {
					pauses++;
				},
				3,
			),
			(error) =>
				error instanceof Error &&
				error.message === "Owned IAM fixture SQL readiness failed",
		);
		assert.equal(calls, 3);
		assert.equal(pauses, 2);
	}
});
