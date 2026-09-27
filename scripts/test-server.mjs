import { spawn } from "node:child_process";
import { startMockApi } from "./mock-api.mjs";
import { startTestProxy } from "./test-proxy.mjs";
const api = await startMockApi();
const web = process.env.WEB_UPSTREAM
	? null
	: spawn(
			process.execPath,
			["node_modules/next/dist/bin/next", "start", "--port", "3108"],
			{ stdio: "inherit" },
		);
const proxy = await startTestProxy(
	3107,
	process.env.WEB_UPSTREAM ?? "http://127.0.0.1:3108",
	"http://127.0.0.1:8107",
);
function stop() {
	web?.kill("SIGTERM");
	for (const server of [api, proxy]) {
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
