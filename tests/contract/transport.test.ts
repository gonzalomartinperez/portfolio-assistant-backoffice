import { field, list, record, text } from "../../scripts/json.ts";
import type { Progress } from "../../src/features/assistant/domain/models.ts";
import { AssistantError } from "../../src/features/assistant/application/ports.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { createHttpTransport } from "../../src/features/assistant/adapters/api.ts";
const signal = new AbortController().signal;
const json = (value: unknown, status = 200) =>
	new Response(JSON.stringify(value), {
		status,
		headers: { "content-type": "application/json" },
	});
test("session bootstrap sends credentials and subsequent mutations carry CSRF", async () => {
	const calls: {
		url: Parameters<typeof fetch>[0];
		init: RequestInit | undefined;
	}[] = [];
	const api = createHttpTransport("https://example.test", async (url, init) => {
		calls.push({ url, init });
		if (calls.length === 1) return json({}, 401);
		if (calls.length === 2)
			return json({ csrf_token: "token", retention_days: 7 });
		return new Response(null, { status: 204 });
	});
	await api.session(signal);
	await api.deleteConversation("id", signal);
	assert.equal(calls[0]?.init?.credentials, "include");
	assert.equal(calls[0]?.init?.cache, "no-store");
	assert.equal(calls[2]?.init?.cache, "no-store");
	assert.equal(
		new Headers(calls[1]?.init?.headers).get("X-Session-Bootstrap"),
		"1",
	);
	assert.equal(
		new Headers(calls[2]?.init?.headers).get("X-CSRF-Token"),
		"token",
	);
});
test("errors are classified without forwarding backend details or retrying", async () => {
	for (const [status, reason] of [
		[401, "expired"],
		[403, "rejected"],
		[422, "rejected"],
		[500, "unavailable"],
	] satisfies Array<[number, string]>) {
		let calls = 0;
		const api = createHttpTransport("https://example.test", async () => {
			calls++;
			return json({ message: "private stack trace" }, status);
		});
		await assert.rejects(
			api.deleteConversation("id", signal),
			(e: unknown) =>
				e instanceof AssistantError &&
				e.reason === reason &&
				!e.message.includes("private"),
		);
		assert.equal(calls, 1);
	}
});
test("history validates and reverses newest-first pages; pagination is bounded", async () => {
	let calls = 0;
	const msg = (id: string) => ({
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
	const frame = (type: string, sequence: number, payload: unknown) =>
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
			assert.ok(new Headers(init?.headers).get("Idempotency-Key"));
			return new Response(body, {
				headers: { "content-type": "text/event-stream", "X-Run-ID": "run" },
			});
		},
	);
	const events: Progress[] = [];
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
	assert.equal("sequence" in record(events[2]), false);
	body = frame("message.delta", 0, { text: "partial" });
	await assert.rejects(
		api.send("id", "question", "en", signal, () => {}, "key"),
		(e: unknown) => e instanceof AssistantError && e.reason === "interrupted",
	);
});

test("committed API handoff examples map through the real stream boundary", async () => {
	const { readFileSync } = await import("node:fs");
	const examples = record(
		JSON.parse(readFileSync("contracts/sse.examples.json", "utf8")),
	);
	for (const [events, terminal] of [
		[list(examples.success_abstention), "completed"],
		[[examples.failure], "failed"],
		[[examples.cancelled], "cancelled"],
	] satisfies Array<[unknown[], string]>) {
		const body = events
			.map(
				(event) =>
					`event: ${text(field(event, "type"))}\ndata: ${JSON.stringify(event)}\n\n`,
			)
			.join("");
		const mapped: string[] = [];
		const api = createHttpTransport("", async (url) => {
			assert.ok(typeof url === "string" && url.startsWith("/api/v1/"));
			return new Response(body, {
				headers: {
					"content-type": "text/event-stream",
					"X-Run-ID": text(field(events[0], "run_id")),
				},
			});
		});
		await api.send(
			text(field(events[0], "conversation_id")),
			"question",
			"en",
			signal,
			(event) => mapped.push(event.kind),
			"example-key",
		);
		assert.equal(mapped.at(-1), terminal);
	}
});
