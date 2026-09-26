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
	while (true) {
		const { value, done } = await reader.read();
		buffer += decoder.decode(value, { stream: !done });
		const frames = buffer.split(/\r?\n\r?\n/);
		buffer = frames.pop() ?? "";
		for (const frame of frames) {
			const data = frame
				.split(/\r?\n/)
				.filter((line) => line.startsWith("data: "))
				.map((line) => line.slice(6))
				.join("\n");
			if (!data) continue;
			const event = JSON.parse(data) as StreamEvent;
			if (event.schema_version !== "1" || typeof event.sequence !== "number")
				throw new Error("Invalid stream event");
			onEvent(event);
			terminal ||= ["run.completed", "run.failed", "run.cancelled"].includes(
				event.type,
			);
		}
		if (done) break;
	}
	return terminal;
}
