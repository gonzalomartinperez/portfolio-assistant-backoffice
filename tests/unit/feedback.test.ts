import assert from "node:assert/strict";
import test from "node:test";
import { parseFeedback } from "../../src/features/operations/adapters/feedback-validate.ts";
import { createFeedbackHttp } from "../../src/features/operations/adapters/feedback-http.ts";
import { helpfulShare } from "../../src/features/operations/domain/feedback.ts";
import { feedbackPayload } from "../fixtures/feedback.ts";
const config = {
	enabled: true,
	origin: "http://api-private:8000",
	token: "synthetic-feedback-token",
};
test("rating signal maps closed wire and preserves no-rating as undefined share", () => {
	const result = parseFeedback(feedbackPayload);
	assert.equal(result.up, 14);
	assert.equal(helpfulShare({ ...result, up: 0, down: 0 }), null);
	assert.equal(helpfulShare({ ...result, up: 1, down: 1 }), 0.5);
	for (const change of [
		{ message: "synthetic" },
		{ up: -1 },
		{ down: Infinity },
		{ schema_version: 2 },
		{ basis: "rating_submission" },
		{ project: "pequeverso" },
		{ observed_at: "2026-02-31T00:00:00Z" },
		{ observed_at: "2026-10-17T12:00:00" },
	])
		assert.throws(
			() => parseFeedback({ ...feedbackPayload, ...change }),
			/Invalid feedback/,
		);
});
test("disabled feedback never requests data and missing configuration is unavailable", async () => {
	let calls = 0;
	const request: typeof fetch = async () => {
		calls++;
		throw Error("unexpected");
	};
	assert.deepEqual(
		await createFeedbackHttp({ ...config, enabled: false, request }).read(),
		{ kind: "disabled" },
	);
	assert.deepEqual(
		await createFeedbackHttp({ ...config, origin: undefined, request }).read(),
		{ kind: "unavailable" },
	);
	assert.equal(calls, 0);
});
test("feedback transport uses exact private path with bounded no-store credentialless reads", async () => {
	let calls = 0;
	const result = await createFeedbackHttp({
		...config,
		request: async (url, init) => {
			calls++;
			assert.equal(
				String(url),
				"http://api-private:8000/internal/ops/v1/feedback",
			);
			assert.equal(init?.cache, "no-store");
			assert.equal(init?.credentials, "omit");
			assert.equal(init?.redirect, "error");
			assert.equal(
				new Headers(init?.headers).get("Authorization"),
				`Bearer ${config.token}`,
			);
			return Response.json(feedbackPayload);
		},
	}).read();
	assert.equal(result.kind, "available");
	assert.equal(calls, 1);
	for (const response of [
		new Response(null, { status: 404 }),
		Response.json({ ...feedbackPayload, question: "synthetic" }),
		new Response("x".repeat(4097), {
			headers: { "content-type": "application/json" },
		}),
	])
		assert.deepEqual(
			await createFeedbackHttp({
				...config,
				request: async () => response,
			}).read(),
			{ kind: "unavailable" },
		);
});
