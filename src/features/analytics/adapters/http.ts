import type { ProductReadPort } from "../application/read.ts";
import { parseProductSnapshot } from "./validate.ts";
export function createProductHttp({
	enabled,
	origin,
	token,
	request = fetch,
}: {
	enabled: boolean;
	origin: string | undefined;
	token: string | undefined;
	request?: typeof fetch;
}): ProductReadPort {
	return {
		async read() {
			if (!enabled) return { kind: "disabled" };
			if (!origin || !token) return { kind: "unavailable" };
			try {
				const url = new URL(origin);
				if (
					!["http:", "https:"].includes(url.protocol) ||
					url.username ||
					url.password ||
					url.pathname !== "/" ||
					url.search ||
					url.hash
				)
					return { kind: "unavailable" };
				url.pathname = "/internal/ops/v1/product-analytics";
				const response = await request(url, {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
					cache: "no-store",
					credentials: "omit",
					redirect: "error",
					signal: AbortSignal.timeout(5000),
				});
				if (
					!response.ok ||
					response.headers
						.get("content-type")
						?.split(";")[0]
						?.trim()
						.toLowerCase() !== "application/json" ||
					Number(response.headers.get("content-length") ?? 0) > 256000 ||
					!response.body
				) {
					await response.body?.cancel();
					return { kind: "unavailable" };
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
						if (bytes > 256000) throw new Error("Analytics payload limit");
						body += decoder.decode(chunk.value, { stream: true });
					}
					body += decoder.decode();
					return {
						kind: "available",
						snapshot: parseProductSnapshot(JSON.parse(body)),
					};
				} finally {
					await reader.cancel().catch(() => {});
					reader.releaseLock();
				}
			} catch {
				return { kind: "unavailable" };
			}
		},
	};
}
