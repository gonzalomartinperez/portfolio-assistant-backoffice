import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, cp, access } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureSession } from "./auth-fixture-session.ts";
import { readAuthConfiguration } from "../src/features/auth/config.ts";
import { startTestProxy } from "./test-proxy.ts";
import {
	startOperationsFixture,
	operationsFixtureToken,
} from "./operations-fixture.ts";

const env = {
	...process.env,
	BACKOFFICE_ORIGIN: "http://localhost:3107",
	BACKOFFICE_DATABASE_URL:
		process.env.BACKOFFICE_DATABASE_URL ??
		"postgres://backoffice_fixture:public-fixture-only@127.0.0.1:15432/backoffice_test",
	BETTER_AUTH_SECRET:
		process.env.BETTER_AUTH_SECRET ??
		"public-fixture-only-at-least-32-characters",
	BACKOFFICE_OWNER_EMAIL:
		process.env.BACKOFFICE_OWNER_EMAIL ?? "owner@example.test",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "public-fixture-client",
	GOOGLE_CLIENT_SECRET:
		process.env.GOOGLE_CLIENT_SECRET ?? "public-fixture-secret",
	GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? "public-fixture-client",
	GITHUB_CLIENT_SECRET:
		process.env.GITHUB_CLIENT_SECRET ?? "public-fixture-secret",
	OPERATIONS_API_ORIGIN: "http://127.0.0.1:8117",
	OPERATIONS_READ_TOKEN: operationsFixtureToken,
	OPERATIONS_SOURCE_MODE: "fixture",
};
const database = new URL(env.BACKOFFICE_DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname))
	throw new Error("Managed fixture database must be loopback");
if (process.env.WEB_UPSTREAM) {
	const upstream = new URL(process.env.WEB_UPSTREAM);
	if (!["localhost", "127.0.0.1", "[::1]"].includes(upstream.hostname))
		throw new Error("Fixture upstream must be loopback");
} else {
	try {
		await access(".next/standalone/server.js");
	} catch {
		throw new Error(
			"Build the production application before starting fixtures",
		);
	}
	await cp("public", ".next/standalone/public", { recursive: true });
	await cp(".next/static", ".next/standalone/.next/static", {
		recursive: true,
	});
}
const directory = resolve(".artifacts");
const sessionsFile = resolve(directory, "fixture-sessions.json");
await mkdir(directory, { recursive: true, mode: 0o700 });
const configuration = readAuthConfiguration(env);
await writeFile(
	sessionsFile,
	JSON.stringify({
		owner: await fixtureSession("owner", configuration),
		viewer: await fixtureSession("viewer", configuration),
	}),
	{ mode: 0o600 },
);
const operations = await startOperationsFixture({
	host: process.env.WEB_UPSTREAM ? "0.0.0.0" : "127.0.0.1",
	mode: process.env.OPERATIONS_FIXTURE_MODE ?? "available",
});
const web = process.env.WEB_UPSTREAM
	? null
	: spawn(process.execPath, [".next/standalone/server.js"], {
			stdio: "inherit",
			env: { ...env, PORT: "3108", HOSTNAME: "127.0.0.1" },
		});
const proxy = await startTestProxy(
	3107,
	process.env.WEB_UPSTREAM ?? "http://127.0.0.1:3108",
	process.env.WEB_UPSTREAM ?? "http://127.0.0.1:3108",
).catch(async (error: unknown) => {
	web?.kill("SIGTERM");
	operations.closeAllConnections();
	operations.close();
	await rm(sessionsFile, { force: true });
	throw error;
});
let stopped = false;
async function stop() {
	if (stopped) return;
	stopped = true;
	web?.kill("SIGTERM");
	for (const server of [operations, proxy]) {
		server.closeAllConnections();
		server.close();
	}
	await rm(sessionsFile, { force: true });
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
web?.on("exit", (code) => {
	void stop();
	process.exitCode = code ?? 0;
});
