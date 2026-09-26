import test from "node:test";
import assert from "node:assert/strict";
import { readSse } from "../lib/sse.ts";

test("parses UTF-8 and frame fragments without losing a terminal event", async () => {
	const bytes = new TextEncoder().encode(
		'event: message.delta\ndata: {"type":"message.delta","schema_version":"1","run_id":"a","conversation_id":"b","sequence":0,"timestamp":"x","payload":{"text":"Español"}}\n\nevent: run.completed\ndata: {"type":"run.completed","schema_version":"1","run_id":"a","conversation_id":"b","sequence":1,"timestamp":"x","payload":{}}\n\n',
	);
	const events = [];
	const stream = new ReadableStream({
		start(controller) {
			for (let i = 0; i < bytes.length; i += 3)
				controller.enqueue(bytes.slice(i, i + 3));
			controller.close();
		},
	});
	assert.equal(await readSse(stream, (event) => events.push(event)), true);
	assert.equal(events.length, 2);
	assert.equal(events[0].payload.text, "Español");
});

test("reports a nonterminal cut stream", async () => {
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(
				new TextEncoder().encode(
					'event: message.delta\ndata: {"type":"message.delta","schema_version":"1","run_id":"a","conversation_id":"b","sequence":0,"timestamp":"x","payload":{}}\n\n',
				),
			);
			controller.close();
		},
	});
	assert.equal(await readSse(stream, () => {}), false);
});
