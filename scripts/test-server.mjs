import { spawn } from "node:child_process";
import { startMockApi } from "./mock-api.mjs";
import { startTestProxy } from "./test-proxy.mjs";
import { startEmbedHost } from "./embed-host.mjs";
const host = await startEmbedHost();
const api = await startMockApi();
const web = process.env.WEB_UPSTREAM
	? null
	: spawn(
			process.execPath,
			["node_modules/next/dist/bin/next", "start", "--port", "3108"],
			{
				stdio: "inherit",
				env: { ...process.env, EMBED_ALLOWED_ORIGINS: "http://localhost:3110" },
			},
		);
const proxy = await startTestProxy(
	3107,
	process.env.WEB_UPSTREAM ?? "http://127.0.0.1:3108",
	"http://127.0.0.1:8107",
);
function stop() {
	web?.kill("SIGTERM");
	for (const server of [api, proxy, host]) {
		server.closeAllConnections();
		server.close();
	}
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
web?.on("exit", (code) => {
	stop();
	process.exitCode = code ?? 0;
});
