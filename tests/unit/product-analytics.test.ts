import assert from "node:assert/strict";
import test from "node:test";
import { parseProductSnapshot } from "../../src/features/analytics/adapters/validate.ts";
import { createProductHttp } from "../../src/features/analytics/adapters/http.ts";
import { dailyTotals } from "../../src/features/analytics/domain/models.ts";
import { productPayload } from "../fixtures/product-analytics.ts";
const config = {
	enabled: true,
	origin: "http://api-private:8000",
	token: "synthetic-private-test",
};
test("product schema maps wire to pure model and aggregates only selected event", () => {
	const snapshot = parseProductSnapshot(productPayload);
	assert.deepEqual(dailyTotals(snapshot.counts, "page_view"), [
		{ day: "2026-10-16", count: 18 },
		{ day: "2026-10-17", count: 24 },
	]);
	assert.deepEqual(dailyTotals(snapshot.counts, "company_link_open"), []);
	assert.equal("schema_version" in snapshot, false);
});
test("product boundary rejects leaked fields, ambiguity and forged dimensions", () => {
	const first = productPayload.counts[0];
	assert.ok(first);
	for (const candidate of [
		{ ...productPayload, transcript: "synthetic" },
		{ ...productPayload, country: "AR" },
		{ ...productPayload, project: "pequeverso" },
		{ ...productPayload, counts: [{ ...first, count: -1 }] },
		{ ...productPayload, counts: [{ ...first, count: Infinity }] },
		{ ...productPayload, counts: [{ ...first, day: "2026-02-31" }] },
		{
			...productPayload,
			counts: [{ ...first, target: "javascript:alert(1)" }],
		},
		{
			...productPayload,
			counts: [{ ...first, event_name: "company_link_open", target: "rampy" }],
		},
		{ ...productPayload, counts: [first, first] },
		{ ...productPayload, counts: [{ ...first, token: "synthetic" }] },
		{ ...productPayload, counts: Array(4001).fill(first) },
	])
		assert.throws(() => parseProductSnapshot(candidate), /Invalid|Duplicate/);
});
test("default-off analytics port performs no requests and does not invent zero", async () => {
	let calls = 0;
	const result = await createProductHttp({
		...config,
		enabled: false,
		request: async () => {
			calls++;
			throw new Error("unexpected");
		},
	}).read();
	assert.deepEqual(result, { kind: "disabled" });
	assert.equal(calls, 0);
});
test("private aggregate adapter pins path, omits credentials and bounds response", async () => {
	const result = await createProductHttp({
		...config,
		request: async (target, init) => {
			assert.equal(
				String(target),
				"http://api-private:8000/internal/ops/v1/product-analytics",
			);
			assert.equal(init?.credentials, "omit");
			assert.equal(init?.cache, "no-store");
			assert.equal(init?.redirect, "error");
			assert.equal(
				new Headers(init?.headers).get("authorization"),
				`Bearer ${config.token}`,
			);
			return Response.json(productPayload);
		},
	}).read();
	assert.equal(result.kind, "available");
	for (const response of [
		new Response("", { status: 503 }),
		Response.json({ ...productPayload, counts: null }),
		new Response("{}", { headers: { "content-type": "text/html" } }),
		new Response("x".repeat(256001), {
			headers: { "content-type": "application/json" },
		}),
	]) {
		assert.deepEqual(
			await createProductHttp({
				...config,
				request: async () => response,
			}).read(),
			{ kind: "unavailable" },
		);
	}
});
test("invalid private origins and outages cannot leak token or retry requests", async () => {
	let calls = 0;
	for (const origin of [
		"https://user:password@private/",
		"https://private/path",
		"javascript:alert(1)",
		"https://private/?q=secret",
	]) {
		assert.deepEqual(
			await createProductHttp({
				...config,
				origin,
				request: async () => {
					calls++;
					throw Error("unexpected");
				},
			}).read(),
			{ kind: "unavailable" },
		);
	}
	assert.equal(calls, 0);
	const result = await createProductHttp({
		...config,
		request: async () => {
			calls++;
			throw Error(config.token);
		},
	}).read();
	assert.deepEqual(result, { kind: "unavailable" });
	assert.equal(calls, 1);
	assert.ok(!JSON.stringify(result).includes(config.token));
});
