import ts from "@typescript/typescript6";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
export function startEmbedHost(assistantOrigin = "http://localhost:3107") {
	const html = readFileSync(
		new URL("../tests/fixtures/embed-host.html", import.meta.url),
		"utf8",
	).replaceAll("http://localhost:3107", assistantOrigin);
	const source = readFileSync(
		new URL("../tests/fixtures/embed-host.ts", import.meta.url),
		"utf8",
	).replaceAll("http://localhost:3107", assistantOrigin);
	const script = ts.transpileModule(source, {
		compilerOptions: {
			target: ts.ScriptTarget.ES2022,
			module: ts.ModuleKind.ESNext,
			verbatimModuleSyntax: true,
		},
	}).outputText;
	const server = createServer((request, response) => {
		const isScript = request.url === "/host.js";
		response.writeHead(200, {
			"Content-Type": isScript
				? "text/javascript; charset=utf-8"
				: "text/html; charset=utf-8",
			"Cache-Control": "no-store",
			"Content-Security-Policy": `frame-src ${assistantOrigin}`,
		});
		response.end(isScript ? script : html);
	});
	return new Promise<Server>((resolve, reject) => {
		server.once("error", reject);
		server.listen(3110, "127.0.0.1", () => resolve(server));
	});
}

if (process.argv[1]?.endsWith("embed-host.ts")) {
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
