import test from "node:test";
import assert from "node:assert/strict";
import { createAssistant } from "../../src/features/assistant/application/assistant.ts";
import { AssistantError } from "../../src/features/assistant/application/ports.ts";
import {
	transition,
	canSubmit,
	initialState,
} from "../../src/features/assistant/domain/models.ts";
const item = {
	id: "conversation",
	title: "Test",
	created_at: "now",
	updated_at: "now",
};
const user = {
	id: "user",
	role: "user",
	content: "Question",
	citations: [],
	created_at: "now",
};
const answer = { ...user, id: "answer", role: "assistant", content: "Answer" };
function deferred() {
	let resolve, reject;
	const promise = new Promise((a, b) => {
		resolve = a;
		reject = b;
	});
	return { promise, resolve, reject };
}
function fixture(overrides = {}) {
	let calls = 0;
	const api = {
		session: async () => ({ retention_days: 7 }),
		conversations: async () => [item],
		messages: async () => [],
		createConversation: async () => item,
		renameConversation: async () => {},
		deleteConversation: async () => {},
		feedback: async () => {},
		cancelRun: async () => {},
		send: async (_id, _text, _locale, _signal, progress) => {
			calls++;
			progress({ kind: "started", runId: "run" });
			progress({ kind: "delta", text: "Answer" });
			progress({ kind: "answer", message: answer });
			progress({ kind: "completed" });
		},
		...overrides,
	};
	const app = createAssistant(api, {
		id: () => String(calls),
		now: () => "now",
	});
	return { app, api, calls: () => calls };
}
test("pure lifecycle excludes completion without an active request", () => {
	assert.deepEqual(
		transition({ kind: "ready" }, { kind: "complete", conversationId: "c" }),
		{ kind: "ready" },
	);
	assert.equal(canSubmit(initialState), false);
	const submitting = transition(
		{ kind: "ready" },
		{ kind: "submit", conversationId: "c" },
	);
	assert.deepEqual(
		transition(submitting, { kind: "submit", conversationId: "other" }),
		submitting,
	);
});
test("initialization, submission and completion use application events", async () => {
	let reads = 0;
	const { app, calls } = fixture({
		messages: async () => (++reads === 1 ? [] : [user, answer]),
	});
	await app.initialize();
	assert.equal(app.getSnapshot().lifecycle.kind, "ready");
	await app.submit("Question", "en");
	assert.equal(calls(), 1);
	assert.equal(app.getSnapshot().lifecycle.kind, "completed");
	assert.deepEqual(app.getSnapshot().history, [user, answer]);
});
test("rapid submit is single flight; abort retains partial text without retrying", async () => {
	let sends = 0;
	const { app } = fixture({
		send: async (_id, _text, _locale, signal, progress) => {
			sends++;
			progress({ kind: "started", runId: "run" });
			progress({ kind: "delta", text: "Partial" });
			await new Promise((_, reject) =>
				signal.addEventListener("abort", () => reject(signal.reason), {
					once: true,
				}),
			);
		},
	});
	await app.initialize();
	const first = app.submit("Question", "en");
	assert.equal(await app.submit("Duplicate", "en"), false);
	await app.stop();
	await first;
	assert.equal(sends, 1);
	assert.equal(app.getSnapshot().lifecycle.kind, "cancelled");
	assert.equal(app.getSnapshot().partial.content, "Partial");
	assert.equal(canSubmit(app.getSnapshot()), false);
});
test("early EOF and provider failure preserve a recoverable partial; recovery never sends", async () => {
	let sends = 0;
	let saved = [];
	const { app } = fixture({
		messages: async () => saved,
		send: async (_a, _b, _c, _d, progress) => {
			sends++;
			progress({ kind: "delta", text: "Partial" });
			throw new AssistantError("interrupted");
		},
	});
	await app.initialize();
	await app.submit("Question", "es");
	assert.equal(app.getSnapshot().lifecycle.kind, "failure");
	assert.equal(app.getSnapshot().partial.content, "Partial");
	saved = [user, answer];
	await app.recover();
	assert.equal(app.getSnapshot().partial, null);
	assert.equal(sends, 1);
});
test("late history cannot overwrite another conversation", async () => {
	const old = deferred();
	const { app } = fixture({
		conversations: async () => [],
		messages: async (id) => (id === "old" ? old.promise : [answer]),
	});
	await app.initialize();
	const first = app.selectConversation("old");
	await app.selectConversation("new");
	old.resolve([user]);
	await first;
	assert.deepEqual(app.getSnapshot().history, [answer]);
});
test("unmount aborts the transport and suppresses late updates", async () => {
	const pending = deferred();
	let signal;
	const { app } = fixture({
		send: async (_a, _b, _c, s, progress) => {
			signal = s;
			await pending.promise;
			progress({ kind: "delta", text: "obsolete" });
		},
	});
	await app.initialize();
	const promise = app.submit("Question", "en");
	const snapshot = app.getSnapshot();
	app.dispose();
	pending.resolve();
	await promise;
	assert.equal(signal.aborted, true);
	assert.equal(app.getSnapshot(), snapshot);
});
test("expired session requires explicit recovery; failed deletion preserves history", async () => {
	const { app } = fixture({
		deleteConversation: async () => {
			throw new AssistantError("expired");
		},
	});
	await app.initialize();
	await app.remove(item.id);
	assert.equal(app.getSnapshot().items.length, 1);
	assert.equal(app.getSnapshot().lifecycle.kind, "expired");
	assert.equal(canSubmit(app.getSnapshot()), false);
});
test("stopping while creating a conversation never starts generation", async () => {
	const create = deferred();
	let sends = 0;
	const { app } = fixture({
		conversations: async () => [],
		createConversation: () => create.promise,
		send: async () => {
			sends++;
		},
	});
	await app.initialize();
	const pending = app.submit("Question", "en");
	await app.stop();
	create.resolve(item);
	await pending;
	assert.equal(sends, 0);
	assert.equal(app.getSnapshot().lifecycle.kind, "cancelled");
});
test("a completed message without run completion remains an interrupted partial", async () => {
	const { app } = fixture({
		send: async (_a, _b, _c, _d, progress) => {
			progress({ kind: "answer", message: answer });
			throw new AssistantError("interrupted");
		},
	});
	await app.initialize();
	await app.submit("Question", "en");
	assert.equal(app.getSnapshot().lifecycle.kind, "failure");
	assert.equal(app.getSnapshot().partial.content, "Answer");
});
test("recovery never mistakes an older assistant message for the interrupted answer", async () => {
	const { app } = fixture({
		messages: async () => [answer],
		send: async (_a, _b, _c, _d, progress) => {
			progress({ kind: "delta", text: "Current partial" });
			throw new AssistantError("interrupted");
		},
	});
	await app.initialize();
	await app.submit("Next question", "en");
	await app.recover();
	assert.equal(app.getSnapshot().partial.content, "Current partial");
});
test("late feedback failure cannot replace the active generation lifecycle", async () => {
	const feedback = deferred();
	const response = deferred();
	const { app } = fixture({
		feedback: () => feedback.promise,
		send: async (_a, _b, _c, _d, progress) => {
			progress({ kind: "started", runId: "run" });
			await response.promise;
			progress({ kind: "answer", message: answer });
			progress({ kind: "completed" });
		},
	});
	await app.initialize();
	const rating = app.rate("previous", "up");
	const generation = app.submit("Question", "en");
	feedback.reject(new AssistantError("unavailable"));
	await rating;
	assert.equal(app.getSnapshot().lifecycle.kind, "streaming");
	response.resolve();
	await generation;
	assert.equal(app.getSnapshot().lifecycle.kind, "completed");
});
test("remote cancellation retains partial text when post-stream history is stale", async () => {
	const { app } = fixture({
		messages: async () => [answer],
		send: async (_a, _b, _c, _d, progress) => {
			progress({ kind: "started", runId: "run" });
			progress({ kind: "delta", text: "Current partial" });
			progress({ kind: "cancelled" });
		},
	});
	await app.initialize();
	await app.submit("Next question", "en");
	assert.equal(app.getSnapshot().lifecycle.kind, "cancelled");
	assert.equal(app.getSnapshot().partial.content, "Current partial");
	assert.equal(app.getSnapshot().history.at(-1).content, "Next question");
});
