import assert from "node:assert/strict";
import test from "node:test";
import { parseOperationalSnapshot } from "../../src/features/operations/adapters/validate.ts";
import { createOperationsHttp } from "../../src/features/operations/adapters/http.ts";
import { readOperations } from "../../src/features/operations/application/read.ts";
import { operationalPayload } from "../fixtures/operations.ts";
test("wire maps to a platform-independent operational model", () => {
	const result = parseOperationalSnapshot(operationalPayload);
	assert.equal(result.usage.reservedUsd, 0.01);
	assert.equal(result.executions.total, 24);
	assert.equal(result.traces[0]?.stages[0]?.name, "vector_retrieval");
	assert.equal("schema_version" in result, false);
});
test("rejects sensitive fields, malformed counts, versions and unbounded traces", () => {
	for (const candidate of [
		{ ...operationalPayload, transcript: "must not enter the model" },
		{ ...operationalPayload, schema_version: 2 },
		{
			...operationalPayload,
			traces: Array.from({ length: 101 }, () => operationalPayload.traces[0]),
		},
		{
			...operationalPayload,
			executions: { ...operationalPayload.executions, total: 0 },
		},
		{
			...operationalPayload,
			usage: { ...operationalPayload.usage, settled_usd: Infinity },
		},
		{
			...operationalPayload,
			knowledge: { ...operationalPayload.knowledge, source_commit: "bad" },
		},
	])
		assert.throws(
			() => parseOperationalSnapshot(candidate),
			/Invalid operational payload/,
		);
});
test("missing configuration performs no network request and never invents zero metrics", async () => {
	let calls = 0;
	const port = createOperationsHttp({
		origin: undefined,
		token: undefined,
		request: async () => {
			calls++;
			throw new Error("unexpected");
		},
		now: () => "checked",
	});
	assert.deepEqual(await readOperations(port), {
		kind: "unconfigured",
		checkedAt: "checked",
	});
	assert.equal(calls, 0);
});
test("transport uses only configured private origin, exact path, token and no-store", async () => {
	const port = createOperationsHttp({
		origin: "http://private-api:8000",
		token: "fixture-only",
		request: async (target, init) => {
			assert.equal(
				String(target),
				"http://private-api:8000/internal/ops/v1/status",
			);
			assert.equal(init?.cache, "no-store");
			assert.equal(init?.redirect, "error");
			assert.deepEqual(init?.headers, {
				Authorization: "Bearer fixture-only",
				Accept: "application/json",
			});
			return Response.json(operationalPayload);
		},
	});
	assert.equal((await port.read()).kind, "available");
});
test("failures are explicit and do not expose response bodies or exception secrets", async () => {
	for (const [status, reason] of [
		[403, "authorization"],
		[404, "contract"],
		[503, "transport"],
	] as const) {
		const result = await createOperationsHttp({
			origin: "https://private.example",
			token: "fixture-only",
			request: async () => new Response("private diagnostic", { status }),
		}).read();
		assert.equal(result.kind, "unavailable");
		if (result.kind === "unavailable") assert.equal(result.reason, reason);
		assert.equal(JSON.stringify(result).includes("private diagnostic"), false);
	}
	const result = await createOperationsHttp({
		origin: "https://private.example",
		token: "fixture-only",
		request: async () => {
			throw new Error("private diagnostic");
		},
	}).read();
	assert.equal(result.kind, "unavailable");
	assert.equal(JSON.stringify(result).includes("private diagnostic"), false);
});
test("bounds undeclared chunked response bodies and cancels their readers", async () => {
	let cancelled = false;
	const result = await createOperationsHttp({
		origin: "https://private.example",
		token: "fixture-only",
		request: async () =>
			new Response(
				new ReadableStream({
					start(controller) {
						controller.enqueue(new Uint8Array(256_001));
					},
					cancel() {
						cancelled = true;
					},
				}),
				{ headers: { "Content-Type": "application/json" } },
			),
	}).read();
	assert.equal(result.kind, "unavailable");
	assert.equal(cancelled, true);
});
test("refuses credential URLs, prefixes and redirects rather than leaking the token", async () => {
	for (const origin of [
		"https://user:pass@example.com",
		"https://example.com/prefix",
		"file:///tmp/data",
		"https://example.com/?secret=anything",
	]) {
		const result = await createOperationsHttp({
			origin,
			token: "fixture-only",
			request: async () => {
				throw new Error("network should not run");
			},
		}).read();
		assert.equal(result.kind, "unavailable");
		if (result.kind === "unavailable") assert.equal(result.reason, "contract");
	}
});

test("rejects a non-JSON successful response without consuming untrusted content", async () => {
	let cancelled = false;
	const result = await createOperationsHttp({
		origin: "https://private.example",
		token: "fixture-only",
		request: async () =>
			new Response(
				new ReadableStream({
					cancel() {
						cancelled = true;
					},
				}),
				{ headers: { "Content-Type": "text/html" } },
			),
	}).read();
	assert.equal(result.kind, "unavailable");
	assert.equal(cancelled, true);
});
