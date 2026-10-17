import { readBoundedJson } from "../../../shared/http/bounded-json.ts";
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
				if (!response.ok) {
					await response.body?.cancel();
					return { kind: "unavailable" };
				}
				return {
					kind: "available",
					snapshot: parseProductSnapshot(await readBoundedJson(response)),
				};
			} catch {
				return { kind: "unavailable" };
			}
		},
	};
}
