import test from "node:test";
import assert from "node:assert/strict";
import { createHttpTransport } from "../../src/features/assistant/adapters/api.ts";
const signal = new AbortController().signal;
const json = (value, status = 200) =>
	new Response(JSON.stringify(value), {
		status,
		headers: { "content-type": "application/json" },
	});
test("session bootstrap sends credentials and subsequent mutations carry CSRF", async () => {
	const calls = [];
	const api = createHttpTransport("https://example.test", async (url, init) => {
		calls.push({ url, init });
		if (calls.length === 1) return json({}, 401);
		if (calls.length === 2)
			return json({ csrf_token: "token", retention_days: 7 });
		return new Response(null, { status: 204 });
	});
	await api.session(signal);
	await api.deleteConversation("id", signal);
	assert.equal(calls[0].init.credentials, "include");
	assert.equal(calls[0].init.cache, "no-store");
	assert.equal(calls[2].init.cache, "no-store");
	assert.equal(calls[1].init.headers["X-Session-Bootstrap"], "1");
	assert.equal(calls[2].init.headers["X-CSRF-Token"], "token");
});
test("errors are classified without forwarding backend details or retrying", async () => {
	for (const [status, reason] of [
		[401, "expired"],
		[403, "rejected"],
		[422, "rejected"],
		[500, "unavailable"],
	]) {
		let calls = 0;
		const api = createHttpTransport("https://example.test", async () => {
			calls++;
			return json({ message: "private stack trace" }, status);
		});
		await assert.rejects(
			api.deleteConversation("id", signal),
			(e) => e.reason === reason && !e.message.includes("private"),
		);
		assert.equal(calls, 1);
	}
});
test("history validates and reverses newest-first pages; pagination is bounded", async () => {
	let calls = 0;
	const msg = (id) => ({
		id,
		role: "user",
		content: id,
		citations: [],
		created_at: "now",
	});
	const api = createHttpTransport("https://example.test", async () =>
		json(
			++calls === 1
				? { items: [msg("new")], next_cursor: "cursor" }
				: { items: [msg("old")] },
		),
	);
	assert.deepEqual(
		(await api.messages("id", signal)).map((m) => m.id),
		["old", "new"],
	);
	const invalid = createHttpTransport("https://example.test", async () =>
		json({ items: [{ role: "admin" }] }),
	);
	await assert.rejects(invalid.messages("id", signal), /Invalid message/);
});
test("stream mapping hides infrastructure envelopes and detects early EOF", async () => {
	const frame = (type, sequence, payload) =>
		`event: ${type}\ndata: ${JSON.stringify({ type, sequence, payload, schema_version: "1", run_id: "run", conversation_id: "id", timestamp: "now" })}\n\n`;
	let body =
		frame("run.started", 0, {}) +
		frame("message.delta", 1, { text: "hello" }) +
		frame("message.completed", 2, {
			message_id: "answer",
			content: "hello",
			citations: [],
		}) +
		frame("run.completed", 3, {});
	const api = createHttpTransport(
		"https://example.test",
		async (_url, init) => {
			assert.ok(init.headers["Idempotency-Key"]);
			return new Response(body, {
				headers: { "content-type": "text/event-stream", "X-Run-ID": "run" },
			});
		},
	);
	const events = [];
	await api.send(
		"id",
		"question",
		"en",
		signal,
		(event) => events.push(event),
		"key",
	);
	assert.deepEqual(
		events.map((e) => e.kind),
		["started", "started", "delta", "answer", "completed"],
	);
	assert.equal("sequence" in events[2], false);
	body = frame("message.delta", 0, { text: "partial" });
	await assert.rejects(
		api.send("id", "question", "en", signal, () => {}, "key"),
		(e) => e.reason === "interrupted",
	);
});

test("committed API handoff examples map through the real stream boundary", async () => {
	const { readFileSync } = await import("node:fs");
	const examples = JSON.parse(
		readFileSync("contracts/sse.examples.json", "utf8"),
	);
	for (const [events, terminal] of [
		[examples.success_abstention, "completed"],
		[[examples.failure], "failed"],
		[[examples.cancelled], "cancelled"],
	]) {
		const body = events
			.map(
				(event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
			)
			.join("");
		const mapped = [];
		const api = createHttpTransport("", async (url) => {
			assert.ok(url.startsWith("/api/v1/"));
			return new Response(body, {
				headers: {
					"content-type": "text/event-stream",
					"X-Run-ID": events[0].run_id,
				},
			});
		});
		await api.send(
			events[0].conversation_id,
			"question",
			"en",
			signal,
			(event) => mapped.push(event.kind),
			"example-key",
		);
		assert.equal(mapped.at(-1), terminal);
	}
});
