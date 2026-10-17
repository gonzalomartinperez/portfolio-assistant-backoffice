export async function readBoundedJson(
	response: Response,
	maximum = 256_000,
): Promise<unknown> {
	if (
		response.headers
			.get("content-type")
			?.split(";")[0]
			?.trim()
			.toLowerCase() !== "application/json" ||
		Number(response.headers.get("content-length") ?? 0) > maximum ||
		!response.body
	) {
		await response.body?.cancel().catch(() => {});
		throw new Error("Invalid JSON response");
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder("utf-8", { fatal: true });
	let bytes = 0;
	let body = "";
	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			bytes += chunk.value.byteLength;
			if (bytes > maximum) throw new Error("JSON response limit");
			body += decoder.decode(chunk.value, { stream: true });
		}
		body += decoder.decode();
		return JSON.parse(body);
	} finally {
		await reader.cancel().catch(() => {});
		reader.releaseLock();
	}
}
