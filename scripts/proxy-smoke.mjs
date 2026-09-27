import assert from "node:assert/strict";
import { readSse } from "../src/features/assistant/adapters/sse.ts";
const base = "http://localhost:3001";
const shell = await fetch(base);
assert.equal(
	shell.headers.get("content-security-policy"),
	"frame-ancestors 'none'",
);
assert.equal(shell.headers.get("x-frame-options"), "DENY");
const embed = await fetch(`${base}/embed`);
assert.equal(
	embed.headers.get("content-security-policy"),
	"frame-ancestors http://localhost:3110",
);
assert.equal(embed.headers.get("x-frame-options"), null);
assert.match(embed.headers.get("cache-control"), /no-store/);
// A separate test-only delayed upstream proves proxy flushing before completion.
const probe = await fetch(`${base}/__stream_probe`);
const reader = probe.body.getReader();
const first = await reader.read();
assert.match(new TextDecoder().decode(first.value), /first/);
assert.equal(
	(await (await fetch(`${base}/__stream_status`)).json()).completed,
	false,
);
while (!(await reader.read()).done) {
	/* Drain the bounded two-second fixture. */
}
reader.releaseLock();
const headers = {
	Origin: base,
	"Content-Type": "application/json",
	"X-Session-Bootstrap": "1",
};
const bootstrap = await fetch(`${base}/api/v1/session`, {
	method: "POST",
	headers,
	body: "{}",
});
assert.equal(bootstrap.status, 200);
const cookie = bootstrap.headers.get("set-cookie");
assert.ok(cookie?.includes("HttpOnly"));
assert.ok(!/domain=/i.test(cookie));
headers.Cookie = cookie.split(";")[0];
headers["X-CSRF-Token"] = (await bootstrap.json()).csrf_token;
const call = (path, method = "GET", body) =>
	fetch(`${base}/api/v1${path}`, {
		method,
		headers,
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
try {
	const denied = await fetch(`${base}/api/v1/conversations`, {
		method: "POST",
		headers: { ...headers, Origin: "https://untrusted.invalid" },
		body: "{}",
	});
	assert.equal(denied.status, 403);
	const csrf = await fetch(`${base}/api/v1/conversations`, {
		method: "POST",
		headers: { ...headers, "X-CSRF-Token": "invalid" },
		body: "{}",
	});
	assert.equal(csrf.status, 403);
	const cors = await fetch(`${base}/api/v1/session`, {
		headers: { ...headers, Origin: "https://gonzalomartinperez.com" },
	});
	assert.equal(
		cors.headers.get("access-control-allow-origin"),
		"https://gonzalomartinperez.com",
	);
	assert.equal(cors.headers.get("access-control-allow-credentials"), "true");
	assert.equal((await fetch(`${base}/api/api/v1/session`)).status, 404);
	const oversized = await fetch(`${base}/api/v1/conversations`, {
		method: "POST",
		headers,
		body: "x".repeat(33000),
	});
	assert.equal(oversized.status, 413);
	const belowProxyLimit = await fetch(`${base}/api/v1/conversations`, {
		method: "POST",
		headers,
		body: `{}${" ".repeat(20000)}`,
	});
	assert.equal(belowProxyLimit.status, 200);
	const paddedConversation = await belowProxyLimit.json();
	assert.equal(
		(await call(`/conversations/${paddedConversation.id}`, "DELETE")).status,
		204,
	);
	const created = await call("/conversations", "POST", {});
	assert.equal(created.status, 200);
	const conversation = await created.json();
	const controller = new AbortController();
	const started = performance.now();
	const stream = await fetch(
		`${base}/api/v1/conversations/${conversation.id}/messages/stream`,
		{
			method: "POST",
			headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
			body: JSON.stringify({ content: "What is Filomena?", locale: "en" }),
			signal: controller.signal,
		},
	);
	assert.equal(stream.status, 200);
	assert.match(stream.headers.get("cache-control"), /no-store/);
	let deltas = 0;
	let firstDelta;
	let complete = false;
	await readSse(
		stream.body,
		(event) => {
			if (event.type === "message.delta") {
				deltas++;
				firstDelta ??= performance.now() - started;
			}
			if (event.type === "run.completed") complete = true;
		},
		controller.signal,
	);
	assert.ok(complete && deltas > 0);
	console.log(
		JSON.stringify({
			proxy: "nginx",
			deltas,
			firstDeltaMs: Math.round(firstDelta),
			totalMs: Math.round(performance.now() - started),
		}),
	);
	const cancelled = new AbortController();
	const second = await fetch(
		`${base}/api/v1/conversations/${conversation.id}/messages/stream`,
		{
			method: "POST",
			headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
			body: JSON.stringify({ content: "What is Filomena?", locale: "en" }),
			signal: cancelled.signal,
		},
	);
	assert.equal(second.status, 200);
	const run = second.headers.get("x-run-id");
	assert.ok(run);
	cancelled.abort();
	assert.equal((await call(`/runs/${run}/cancel`, "POST", {})).status, 200);
	let state;
	for (let attempt = 0; attempt < 30; attempt++) {
		state = (await (await call(`/runs/${run}`)).json()).state;
		if (["cancelled", "interrupted", "completed", "failed"].includes(state))
			break;
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	assert.ok(
		["cancelled", "interrupted", "completed", "failed"].includes(state),
	);
	assert.equal(
		(await call(`/conversations/${conversation.id}`, "DELETE")).status,
		204,
	);
	console.log(
		"Proxy path, origin/CSRF, cookie, body limit, streaming, disconnect/cancel and deletion checks passed.",
	);
} finally {
	await call("/session", "DELETE");
}

// SIGQUIT must drain an already-open stream before this test proxy exits.
const { spawn } = await import("node:child_process");
const compose = (...args) =>
	new Promise((resolve, reject) => {
		const child = spawn(
			"docker",
			[
				"compose",
				"-p",
				"assistant-web-verification",
				"-f",
				"tests/integration/compose.yaml",
				...args,
			],
			{ stdio: "ignore" },
		);
		child.on("error", reject);
		child.on("exit", (code) =>
			code === 0 ? resolve() : reject(new Error(`Compose exited ${code}`)),
		);
	});
try {
	const active = await fetch(`${base}/__stream_probe`);
	const activeReader = active.body.getReader();
	await activeReader.read();
	const stopping = compose("stop", "proxy");
	let remaining = "";
	for (;;) {
		const { done, value } = await activeReader.read();
		if (done) break;
		remaining += new TextDecoder().decode(value);
	}
	activeReader.releaseLock();
	await stopping;
	assert.match(remaining, /done/);
	console.log("Nginx graceful shutdown drained the active delayed stream.");
} finally {
	await compose("up", "-d", "proxy");
}
