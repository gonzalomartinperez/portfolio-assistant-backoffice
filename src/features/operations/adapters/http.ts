import { readBoundedJson } from "../../../shared/http/bounded-json.ts";
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
				if (!response.ok) {
					await response.body?.cancel();
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
				}
				try {
					return {
						kind: "available",
						snapshot: parseOperationalSnapshot(await readBoundedJson(response)),
						checkedAt,
					};
				} catch {
					return { kind: "unavailable", reason: "contract", checkedAt };
				}
			} catch {
				return { kind: "unavailable", reason: "transport", checkedAt };
			}
		},
	};
}
