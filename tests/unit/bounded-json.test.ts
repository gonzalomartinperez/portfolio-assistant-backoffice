import assert from "node:assert/strict";
import test from "node:test";
import { readBoundedJson } from "../../src/shared/http/bounded-json.ts";
test("bounded JSON preserves split UTF-8 and releases the stream reader", async () => {
	const bytes = new TextEncoder().encode(JSON.stringify({ label: "Español" }));
	let offset = 0;
	const body = new ReadableStream<Uint8Array>({
		pull(controller) {
			if (offset === bytes.length) controller.close();
			else controller.enqueue(bytes.slice(offset, ++offset));
		},
	});
	const response = new Response(body, {
		headers: { "content-type": "application/json" },
	});
	assert.deepEqual(await readBoundedJson(response), { label: "Español" });
	assert.equal(body.locked, false);
});
test("untrusted unbounded/non-JSON data is rejected with deterministic cancellation", async () => {
	let cancelled = false;
	const body = new ReadableStream<Uint8Array>({
		pull(controller) {
			controller.enqueue(new Uint8Array(20));
		},
		cancel() {
			cancelled = true;
		},
	});
	await assert.rejects(
		() =>
			readBoundedJson(
				new Response(body, { headers: { "content-type": "application/json" } }),
				16,
			),
		/limit/,
	);
	assert.equal(cancelled, true);
	assert.equal(body.locked, false);
	await assert.rejects(
		() =>
			readBoundedJson(
				new Response("{}", { headers: { "content-type": "text/html" } }),
			),
		/Invalid/,
	);
	await assert.rejects(() =>
		readBoundedJson(
			new Response(new Uint8Array([255]), {
				headers: { "content-type": "application/json" },
			}),
		),
	);
});
