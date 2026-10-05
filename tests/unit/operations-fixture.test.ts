import assert from "node:assert/strict";
import test from "node:test";
import {
	startOperationsFixture,
	operationsFixtureToken,
} from "../../scripts/operations-fixture.ts";

test("operational fixture authenticates every read and exposes immutable failure modes", async () => {
	for (const mode of ["available", "unavailable", "malformed"]) {
		const server = await startOperationsFixture({ port: 0, mode });
		try {
			const address = server.address();
			if (!address || typeof address === "string")
				throw new Error("Missing fixture port");
			const url = `http://127.0.0.1:${address.port}/internal/ops/v1/status`;
			assert.equal((await fetch(url)).status, 401);
			const response = await fetch(url, {
				headers: { Authorization: `Bearer ${operationsFixtureToken}` },
			});
			assert.equal(response.headers.get("cache-control"), "no-store");
			assert.equal(response.status, mode === "unavailable" ? 503 : 200);
			if (mode === "available")
				assert.match(await response.text(), /fixture-1/);
			if (mode === "malformed")
				assert.deepEqual(await response.json(), { status: "unsupported" });
		} finally {
			server.closeAllConnections();
			await new Promise<void>((resolve, reject) =>
				server.close((error) => (error ? reject(error) : resolve())),
			);
		}
	}
	assert.throws(() => startOperationsFixture({ mode: "unknown" }));
});
