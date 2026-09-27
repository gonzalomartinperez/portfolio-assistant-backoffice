export type StreamEvent = {
	type:
		| "run.started"
		| "run.status"
		| "message.delta"
		| "message.completed"
		| "run.completed"
		| "run.failed"
		| "run.cancelled";
	schema_version: "1";
	run_id: string;
	conversation_id: string;
	sequence: number;
	timestamp: string;
	payload: Record<string, unknown>;
};

const types: readonly string[] = [
	"run.started",
	"run.status",
	"message.delta",
	"message.completed",
	"run.completed",
	"run.failed",
	"run.cancelled",
];
const terminalTypes = new Set<StreamEvent["type"]>([
	"run.completed",
	"run.failed",
	"run.cancelled",
]);

function record(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateEvent(value: unknown, frameType: string): StreamEvent {
	if (!record(value)) throw new Error("Invalid stream event");
	const event = value;
	if (
		event.schema_version !== "1" ||
		typeof event.type !== "string" ||
		!types.includes(event.type) ||
		frameType !== event.type ||
		typeof event.run_id !== "string" ||
		!event.run_id ||
		typeof event.conversation_id !== "string" ||
		!event.conversation_id ||
		typeof event.sequence !== "number" ||
		!Number.isSafeInteger(event.sequence) ||
		event.sequence < 0 ||
		typeof event.timestamp !== "string" ||
		!event.timestamp ||
		!record(event.payload)
	)
		throw new Error("Invalid stream event");
	if (
		(event.type === "message.delta" &&
			(typeof event.payload.text !== "string" ||
				event.payload.text.length > 16_000)) ||
		(event.type === "run.failed" && typeof event.payload.code !== "string") ||
		(event.type === "message.completed" &&
			(typeof event.payload.content !== "string" ||
				!Array.isArray(event.payload.citations)))
	)
		throw new Error("Invalid stream payload");
	const type = event.type;
	if (
		type !== "run.started" &&
		type !== "run.status" &&
		type !== "message.delta" &&
		type !== "message.completed" &&
		type !== "run.completed" &&
		type !== "run.failed" &&
		type !== "run.cancelled"
	)
		throw new Error("Invalid stream type");
	return {
		type,
		schema_version: "1",
		run_id: event.run_id,
		conversation_id: event.conversation_id,
		sequence: event.sequence,
		timestamp: event.timestamp,
		payload: event.payload,
	};
}

export async function readSse(
	stream: ReadableStream<Uint8Array>,
	onEvent: (event: StreamEvent) => void,
	signal?: AbortSignal,
): Promise<boolean> {
	const reader = stream.getReader();
	const abort = () => {
		void reader.cancel().catch(() => {});
	};
	signal?.addEventListener("abort", abort, { once: true });
	if (signal?.aborted) abort();
	const decoder = new TextDecoder("utf-8", { fatal: true });
	let buffer = "";
	let terminal = false;
	let totalBytes = 0;
	let lastSequence = -1;
	let runId: string | null = null;
	let conversationId: string | null = null;
	try {
		while (true) {
			signal?.throwIfAborted();
			const { value, done } = await reader.read();
			signal?.throwIfAborted();
			totalBytes += value?.byteLength ?? 0;
			if (totalBytes > 1_000_000) throw new Error("Stream too large");
			buffer += decoder.decode(value, { stream: !done });
			const frames = buffer.split(/\r?\n\r?\n/);
			buffer = frames.pop() ?? "";
			if (buffer.length > 64_000) throw new Error("Event too large");
			for (const frame of frames) {
				if (frame.length > 64_000) throw new Error("Event too large");
				let frameType = "";
				const data: string[] = [];
				for (const line of frame.split(/\r?\n/)) {
					if (line.startsWith("event:")) frameType = line.slice(6).trim();
					if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
				}
				if (!data.length) continue;
				const event = validateEvent(JSON.parse(data.join("\n")), frameType);
				if (
					terminal ||
					event.sequence <= lastSequence ||
					(runId && event.run_id !== runId) ||
					(conversationId && event.conversation_id !== conversationId)
				)
					throw new Error("Invalid stream event order");
				lastSequence = event.sequence;
				runId = event.run_id;
				conversationId = event.conversation_id;
				terminal = terminalTypes.has(event.type);
				onEvent(event);
			}
			if (terminal || done) break;
		}
		if (buffer.trim()) throw new Error("Incomplete stream frame");
		return terminal;
	} finally {
		signal?.removeEventListener("abort", abort);
		await reader.cancel().catch(() => {});
		reader.releaseLock();
	}
}
