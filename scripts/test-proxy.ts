import { createServer, request, type Server } from "node:http";
// Test-only reverse proxy. Production routing belongs to vps-ops and its Coolify configuration.
export function startTestProxy(
	port: number,
	webOrigin: string,
	apiOrigin: string,
) {
	const server = createServer((incoming, outgoing) => {
		const origin = (incoming.url ?? "/").startsWith("/api/")
			? apiOrigin
			: webOrigin;
		const upstream = request(
			new URL(incoming.url ?? "/", origin),
			{
				method: incoming.method,
				headers: incoming.headers,
			},
			(response) => {
				outgoing.writeHead(response.statusCode ?? 502, response.headers);
				response.pipe(outgoing);
			},
		);
		upstream.on("error", () => {
			if (!outgoing.headersSent) outgoing.writeHead(502);
			outgoing.end();
		});
		outgoing.on("close", () => upstream.destroy());
		incoming.pipe(upstream);
	});
	return new Promise<Server>((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, "127.0.0.1", () => resolve(server));
	});
}
if (process.argv[1]?.endsWith("test-proxy.ts")) {
	const server = await startTestProxy(
		3001,
		"http://127.0.0.1:3002",
		"http://127.0.0.1:8000",
	);
	const stop = () => {
		server.closeAllConnections();
		server.close();
	};
	process.on("SIGTERM", stop);
	process.on("SIGINT", stop);
}
