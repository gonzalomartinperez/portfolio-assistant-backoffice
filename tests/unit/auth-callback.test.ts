import assert from "node:assert/strict";
import test from "node:test";
import { callbackResponse } from "../../src/features/auth/callback-response.ts";

test("denied provider callbacks return to the configured origin without arbitrary navigation", () => {
	const response = callbackResponse(
		new Request(
			"https://backoffice.test/api/auth/callback/google?callbackURL=https://evil.test",
			{
				headers: { cookie: "backoffice-locale=es" },
			},
		),
		Response.json({ diagnostic: "private" }, { status: 403 }),
		"https://backoffice.test",
	);
	assert.equal(response.status, 303);
	assert.equal(
		response.headers.get("location"),
		"https://backoffice.test/sign-in?error=access&locale=es",
	);
	assert.equal(response.headers.get("cache-control"), "private, no-store");
	assert.equal(response.headers.get("set-cookie"), null);
});

test("non-callback responses and successful provider cookies remain unchanged", () => {
	for (const [path, status, method] of [
		["/api/auth/callback/github", 302, "GET"],
		["/api/auth/callback/unknown", 403, "GET"],
		["/api/auth/get-session", 403, "GET"],
		["/api/auth/callback/google", 403, "POST"],
	] as const) {
		const response = new Response(null, {
			status,
			headers: { "Set-Cookie": "fixture=value; HttpOnly" },
		});
		assert.equal(
			callbackResponse(
				new Request(`https://backoffice.test${path}`, { method }),
				response,
				"https://backoffice.test",
			),
			response,
		);
	}
});
