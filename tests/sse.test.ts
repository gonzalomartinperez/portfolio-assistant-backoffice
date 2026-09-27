import test from "node:test";
import assert from "node:assert/strict";
import {
	readSse,
	type StreamEvent,
} from "../src/features/assistant/adapters/sse.ts";
import { parseMessage } from "../src/features/assistant/adapters/validate.ts";

function streamOf(text: string) {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new TextEncoder().encode(text));
			controller.close();
		},
	});
}

test("parses UTF-8 and frame fragments without losing a terminal event", async () => {
	const bytes = new TextEncoder().encode(
		'event: message.delta\ndata: {"type":"message.delta","schema_version":"1","run_id":"a","conversation_id":"b","sequence":0,"timestamp":"x","payload":{"text":"Español"}}\n\nevent: run.completed\ndata: {"type":"run.completed","schema_version":"1","run_id":"a","conversation_id":"b","sequence":1,"timestamp":"x","payload":{}}\n\n',
	);
	const events: StreamEvent[] = [];
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			for (let i = 0; i < bytes.length; i += 3)
				controller.enqueue(bytes.slice(i, i + 3));
			controller.close();
		},
	});
	assert.equal(await readSse(stream, (event) => events.push(event)), true);
	assert.equal(events.length, 2);
	assert.equal(events[0]?.payload.text, "Español");
});

test("reports a nonterminal cut stream", async () => {
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(
				new TextEncoder().encode(
					'event: message.delta\ndata: {"type":"message.delta","schema_version":"1","run_id":"a","conversation_id":"b","sequence":0,"timestamp":"x","payload":{"text":"partial"}}\n\n',
				),
			);
			controller.close();
		},
	});
	assert.equal(await readSse(stream, () => {}), false);
});

test("rejects an oversized event without retaining unbounded data", async () => {
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(
				new TextEncoder().encode(`data: ${"x".repeat(65_000)}`),
			);
			controller.close();
		},
	});
	await assert.rejects(
		readSse(stream, () => {}),
		/Event too large/,
	);
});

test("rejects event spoofing, malformed payloads and a second terminal", async () => {
	const frame = (type: string, sequence: number, payload: unknown) =>
		`event: ${type}\ndata: ${JSON.stringify({ type, schema_version: "1", run_id: "a", conversation_id: "b", sequence, timestamp: "x", payload })}\n\n`;
	await assert.rejects(
		readSse(streamOf(frame("message.delta", 0, {})), () => {}),
		/Invalid stream payload/,
	);
	await assert.rejects(
		readSse(
			streamOf(frame("run.completed", 0, {}) + frame("run.completed", 1, {})),
			() => {},
		),
		/Invalid stream event order/,
	);
	await assert.rejects(
		readSse(
			streamOf(
				frame("message.delta", 1, { text: "a" }) +
					frame("message.delta", 1, { text: "b" }),
			),
			() => {},
		),
		/Invalid stream event order/,
	);
	await assert.rejects(
		readSse(
			streamOf(
				'event: run.failed\ndata: {"type":"run.completed","schema_version":"1","run_id":"a","conversation_id":"b","sequence":0,"timestamp":"x","payload":{}}\n\n',
			),
			() => {},
		),
		/Invalid stream event/,
	);
	await assert.rejects(
		readSse(streamOf('event: run.started\ndata: {"type":'), () => {}),
		/Incomplete stream frame/,
	);
});

test("drops unsafe citation links at the JSON boundary", () => {
	const message = parseMessage({
		id: "m",
		role: "assistant",
		content: "Answer",
		created_at: "now",
		citations: [
			{
				id: "c",
				label: "Source",
				source_type: "code",
				url: "javascript:alert(1)",
			},
		],
	});
	assert.deepEqual(message.citations, []);
});

test("CRLF, comments and multiline data survive every byte boundary", async () => {
	const event = {
		type: "message.delta",
		schema_version: "1",
		run_id: "r",
		conversation_id: "c",
		sequence: 0,
		timestamp: "now",
		payload: { text: "¡Hola 🌎!" },
	};
	const input =
		": heartbeat\r\n\r\nevent: message.delta\r\ndata: " +
		JSON.stringify(event).replace(',"payload"', ',\r\ndata: "payload"') +
		"\r\n\r\n";
	const bytes = new TextEncoder().encode(input);
	for (let split = 1; split < bytes.length; split++) {
		const events: StreamEvent[] = [];
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(bytes.slice(0, split));
				controller.enqueue(bytes.slice(split));
				controller.close();
			},
		});
		assert.equal(await readSse(stream, (e) => events.push(e)), false);
		assert.equal(events[0]?.payload.text, "¡Hola 🌎!");
	}
});
test("terminal completion cancels an open connection and releases the reader", async () => {
	let cancelled = false;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(
				new TextEncoder().encode(
					'event: run.completed\ndata: {"type":"run.completed","schema_version":"1","run_id":"r","conversation_id":"c","sequence":0,"timestamp":"now","payload":{}}\n\n',
				),
			);
		},
		cancel() {
			cancelled = true;
		},
	});
	assert.equal(await readSse(stream, () => {}), true);
	assert.equal(cancelled, true);
	assert.equal(stream.locked, false);
});
test("abort and malformed UTF-8 cancel and release their readers", async () => {
	const abort = new AbortController();
	let cancelled = false;
	const stream = new ReadableStream<Uint8Array>({
		cancel() {
			cancelled = true;
		},
	});
	const pending = readSse(stream, () => {}, abort.signal);
	abort.abort();
	await assert.rejects(pending);
	assert.equal(cancelled, true);
	assert.equal(stream.locked, false);
	await assert.rejects(
		readSse(
			new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(new Uint8Array([255]));
					controller.close();
				},
			}),
			() => {},
		),
	);
});
