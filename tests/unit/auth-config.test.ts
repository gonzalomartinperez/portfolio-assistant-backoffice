import assert from "node:assert/strict";
import test from "node:test";
import {
	invitationToken,
	readAuthConfiguration,
	validEmail,
} from "../../src/features/auth/config.ts";
const env: NodeJS.ProcessEnv = {
	NODE_ENV: "test",
	BACKOFFICE_ORIGIN: "http://localhost:3001",
	BACKOFFICE_DATABASE_URL: "postgres://localhost/assistant_backoffice",
	BETTER_AUTH_SECRET: "test-only-secret-with-32-or-more-characters",
	BACKOFFICE_OWNER_EMAIL: "Owner@example.com",
	GOOGLE_CLIENT_ID: "test",
	GOOGLE_CLIENT_SECRET: "test",
	GITHUB_CLIENT_ID: "test",
	GITHUB_CLIENT_SECRET: "test",
};
test("auth configuration rejects insecure production and invalid origins without leaking values", () => {
	assert.equal(readAuthConfiguration(env).ownerEmail, "owner@example.com");
	for (const origin of [
		"http://evil.example",
		"https://example.com/path",
		"https://user:pass@example.com",
		"https://example.com?x=1",
	])
		assert.throws(() =>
			readAuthConfiguration({ ...env, BACKOFFICE_ORIGIN: origin }),
		);
	assert.throws(() =>
		readAuthConfiguration({
			...env,
			NODE_ENV: "production",
			BACKOFFICE_ORIGIN: "http://public.example",
		}),
	);
	assert.throws(
		() =>
			readAuthConfiguration({ ...env, BETTER_AUTH_SECRET: "private-short" }),
		(error) =>
			error instanceof Error && !error.message.includes("private-short"),
	);
});
test("invitation boundary accepts only bounded opaque tokens", () => {
	const token = "a".repeat(64);
	assert.equal(
		invitationToken(
			new Headers({ cookie: `other=value; backoffice-invitation=${token}` }),
		),
		token,
	);
	assert.equal(
		invitationToken(new Headers({ cookie: "backoffice-invitation=<script>" })),
		null,
	);
	assert.equal(invitationToken(undefined), null);
	assert.equal(validEmail("hello@example.com"), true);
	assert.equal(validEmail("hello\n@example.com"), false);
});

test("auth dictionaries are complete and locale parsing remains narrow", async () => {
	const { authCopy, authLocale } = await import(
		"../../src/features/auth/copy.ts"
	);
	assert.deepEqual(
		Object.keys(authCopy.en).sort(),
		Object.keys(authCopy.es).sort(),
	);
	assert.equal(authLocale("es"), "es");
	assert.equal(authLocale("en"), "en");
	assert.equal(authLocale("es-MX"), "en");
	assert.equal(authLocale(["es"]), "en");
	for (const values of Object.values(authCopy))
		for (const text of Object.values(values)) assert.ok(text.trim());
});
