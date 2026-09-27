import { createServer } from "node:http";
import { readFileSync } from "node:fs";
export function startEmbedHost(assistantOrigin = "http://localhost:3107") {
	const html = readFileSync(
		new URL("../tests/fixtures/embed-host.html", import.meta.url),
		"utf8",
	).replaceAll("http://localhost:3107", assistantOrigin);
	const script = readFileSync(
		new URL("../tests/fixtures/embed-host.mjs", import.meta.url),
		"utf8",
	).replaceAll("http://localhost:3107", assistantOrigin);
	const server = createServer((request, response) => {
		const isScript = request.url === "/host.mjs";
		response.writeHead(200, {
			"Content-Type": isScript
				? "text/javascript; charset=utf-8"
				: "text/html; charset=utf-8",
			"Cache-Control": "no-store",
			"Content-Security-Policy": `frame-src ${assistantOrigin}`,
		});
		response.end(isScript ? script : html);
	});
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(3110, "127.0.0.1", () => resolve(server));
	});
}

if (process.argv[1]?.endsWith("embed-host.mjs")) {
	const server = await startEmbedHost(
		process.env.EMBED_FIXTURE_ASSISTANT_ORIGIN,
	);
	const stop = () => {
		server.closeAllConnections();
		server.close();
	};
	process.on("SIGTERM", stop);
	process.on("SIGINT", stop);
}
