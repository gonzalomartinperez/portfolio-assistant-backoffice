import type { OperationsPort } from "../application/read.ts";
import type { OperationalRead } from "../domain/models.ts";
import { parseOperationalSnapshot } from "./validate.ts";
export function createOperationsHttp({
	origin,
	token,
	request = fetch,
	now = () => new Date().toISOString(),
}: {
	origin: string | undefined;
	token: string | undefined;
	request?: typeof fetch;
	now?: () => string;
}): OperationsPort {
	return {
		async read(): Promise<OperationalRead> {
			const checkedAt = now();
			if (!origin || !token) return { kind: "unconfigured", checkedAt };
			let target: URL;
			try {
				target = new URL(origin);
				if (
					!["http:", "https:"].includes(target.protocol) ||
					target.username ||
					target.password ||
					target.pathname !== "/" ||
					target.search ||
					target.hash
				)
					return { kind: "unavailable", reason: "contract", checkedAt };
				target.pathname = "/internal/ops/v1/status";
			} catch {
				return { kind: "unavailable", reason: "contract", checkedAt };
			}
			try {
				const response = await request(target, {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
					cache: "no-store",
					redirect: "error",
					signal: AbortSignal.timeout(5000),
				});
				if (!response.ok)
					return {
						kind: "unavailable",
						reason:
							response.status === 401 || response.status === 403
								? "authorization"
								: response.status === 404
									? "contract"
									: "transport",
						checkedAt,
					};
				const declaredSize = Number(
					response.headers.get("content-length") ?? 0,
				);
				if (declaredSize > 256_000) {
					await response.body?.cancel();
					return { kind: "unavailable", reason: "contract", checkedAt };
				}
				if (!response.body)
					return { kind: "unavailable", reason: "contract", checkedAt };
				const reader = response.body.getReader();
				const decoder = new TextDecoder("utf-8", { fatal: true });
				let bytes = 0;
				let body = "";
				try {
					while (true) {
						const chunk = await reader.read();
						if (chunk.done) break;
						bytes += chunk.value.byteLength;
						if (bytes > 256_000) throw new Error("Payload limit");
						body += decoder.decode(chunk.value, { stream: true });
					}
					body += decoder.decode();
					return {
						kind: "available",
						snapshot: parseOperationalSnapshot(JSON.parse(body)),
						checkedAt,
					};
				} catch {
					return { kind: "unavailable", reason: "contract", checkedAt };
				} finally {
					await reader.cancel().catch(() => {});
					reader.releaseLock();
				}
			} catch {
				return { kind: "unavailable", reason: "transport", checkedAt };
			}
		},
	};
}
