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

export async function readSse(
	stream: ReadableStream<Uint8Array>,
	onEvent: (event: StreamEvent) => void,
): Promise<boolean> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let terminal = false;
	let totalBytes = 0;
	let lastSequence = -1;
	while (true) {
		const { value, done } = await reader.read();
		totalBytes += value?.byteLength ?? 0;
		if (totalBytes > 1_000_000) throw new Error("Stream too large");
		buffer += decoder.decode(value, { stream: !done });
		const frames = buffer.split(/\r?\n\r?\n/);
		buffer = frames.pop() ?? "";
		if (buffer.length > 64_000) throw new Error("Event too large");
		for (const frame of frames) {
			if (frame.length > 64_000) throw new Error("Event too large");
			const data = frame
				.split(/\r?\n/)
				.filter((line) => line.startsWith("data: "))
				.map((line) => line.slice(6))
				.join("\n");
			if (!data) continue;
			const event = JSON.parse(data) as StreamEvent;
			if (
				event.schema_version !== "1" ||
				typeof event.sequence !== "number" ||
				event.sequence <= lastSequence
			)
				throw new Error("Invalid stream event");
			lastSequence = event.sequence;
			onEvent(event);
			terminal ||= ["run.completed", "run.failed", "run.cancelled"].includes(
				event.type,
			);
		}
		if (done) break;
	}
	return terminal;
}
