import { feedbackPayload } from "../tests/fixtures/feedback.ts";
import { createServer, type Server } from "node:http";
import { productPayload } from "../tests/fixtures/product-analytics.ts";
import { operationalPayload } from "../tests/fixtures/operations.ts";

export const operationsFixtureToken = "public-loopback-operations-fixture";
export function startOperationsFixture({
	port = 8117,
	host = "127.0.0.1",
	mode = "available",
}: {
	port?: number;
	host?: "127.0.0.1" | "0.0.0.0";
	mode?: string;
} = {}): Promise<Server> {
	if (!["available", "unavailable", "malformed"].includes(mode))
		throw new Error("Unknown operational fixture mode");
	const server = createServer((incoming, outgoing) => {
		outgoing.setHeader("Cache-Control", "no-store");
		if (
			![
				"/internal/ops/v1/status",
				"/internal/ops/v1/product-analytics",
				"/internal/ops/v1/feedback",
			].includes(incoming.url ?? "")
		) {
			outgoing.writeHead(404).end();
			return;
		}
		if (incoming.headers.authorization !== `Bearer ${operationsFixtureToken}`) {
			outgoing.writeHead(401).end();
			return;
		}
		if (mode === "unavailable") {
			outgoing.writeHead(503).end();
			return;
		}
		outgoing.setHeader("Content-Type", "application/json");
		outgoing.end(
			JSON.stringify(
				mode === "malformed"
					? { status: "unsupported" }
					: incoming.url === "/internal/ops/v1/feedback"
						? feedbackPayload
						: incoming.url === "/internal/ops/v1/product-analytics"
							? productPayload
							: operationalPayload,
			),
		);
	});
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, host, () => resolve(server));
	});
}
