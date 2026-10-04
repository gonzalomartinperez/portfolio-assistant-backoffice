import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { genericOAuth } from "better-auth/plugins";
import { createAuthRuntime } from "../../src/features/auth/runtime.ts";
const databaseUrl = process.env.BACKOFFICE_DATABASE_URL;
if (!databaseUrl)
	throw new Error(
		"BACKOFFICE_DATABASE_URL must identify an isolated test database",
	);
if (!/(test|fixture)/.test(new URL(databaseUrl).pathname))
	throw new Error(
		"Authentication integration requires an isolated test/fixture database",
	);
const configuration = {
	origin: "http://localhost:3971",
	databaseUrl,
	secret: "fixture-only-secret-at-least-32-characters",
	ownerEmail: "owner@example.com",
	google: { clientId: "fixture", clientSecret: "fixture" },
	github: { clientId: "fixture", clientSecret: "fixture" },
};

test("real PostgreSQL and Better Auth enforce invitation, role and revocation boundaries", async () => {
	const { pool, store, options } = createAuthRuntime(configuration);
	try {
		await (await getMigrations(options)).runMigrations();
		await pool.query(
			await readFile(
				new URL("../../migrations/001-access.sql", import.meta.url),
				"utf8",
			),
		);
		await pool.query(
			'TRUNCATE backoffice_access_audit,backoffice_invitation,backoffice_member,session,account,"user",verification CASCADE',
		);
		const auth = betterAuth({
			...options,
			plugins: [
				genericOAuth({
					config: [
						{
							providerId: "fixture",
							clientId: "fixture",
							clientSecret: "fixture",
							authorizationUrl: "http://localhost:3972/authorize",
							tokenUrl: "http://localhost:3972/token",
							getUserInfo: async () => ({
								id: "owner",
								name: "Owner",
								email: "owner@example.com",
								emailVerified: true,
							}),
						},
					],
				}),
			],
		});
		const context = await auth.$context;
		const provider = createServer((request, response) => {
			if (request.url === "/token") {
				response.setHeader("content-type", "application/json");
				response.end(
					JSON.stringify({
						access_token: "fixture-token",
						token_type: "Bearer",
						expires_in: 3600,
					}),
				);
			} else {
				response.statusCode = 404;
				response.end();
			}
		});
		await new Promise<void>((resolve) =>
			provider.listen(3972, "127.0.0.1", resolve),
		);
		try {
			const start = await auth.handler(
				new Request("http://localhost:3971/api/auth/sign-in/social", {
					method: "POST",
					headers: {
						"content-type": "application/json",
						origin: configuration.origin,
					},
					body: JSON.stringify({ provider: "fixture", callbackURL: "/" }),
				}),
			);
			assert.equal(start.status, 200);
			const payload: unknown = await start.json();
			assert.ok(
				payload &&
					typeof payload === "object" &&
					"url" in payload &&
					typeof payload.url === "string",
			);
			const state = new URL(payload.url).searchParams.get("state");
			assert.ok(state);
			const cookie = start.headers
				.getSetCookie()
				.map((value) => value.split(";")[0])
				.join("; ");
			const callback = await auth.handler(
				new Request(
					`http://localhost:3971/api/auth/callback/fixture?code=test&state=${encodeURIComponent(state)}`,
					{ headers: { cookie } },
				),
			);
			assert.equal(callback.status, 302);
			assert.ok(
				callback.headers
					.getSetCookie()
					.some((value) => value.startsWith("backoffice.session_token=")),
			);
			const replay = await auth.handler(
				new Request(
					`http://localhost:3971/api/auth/callback/fixture?code=test&state=invalid`,
					{ headers: { cookie } },
				),
			);
			assert.ok(replay.headers.get("location")?.includes("error"));
		} finally {
			await new Promise<void>((resolve, reject) =>
				provider.close((error) => (error ? reject(error) : resolve())),
			);
		}

		const ownerFromProvider = await context.internalAdapter.findUserByEmail(
			configuration.ownerEmail,
		);
		assert.ok(ownerFromProvider);
		const owner = ownerFromProvider.user;

		assert.ok(owner);
		const ownerSession = await context.internalAdapter.createSession(owner.id);
		assert.ok(ownerSession);
		assert.equal((await store.access(owner))?.role, "owner");
		await assert.rejects(() =>
			context.internalAdapter.createUser(
				{
					name: "Stranger",
					email: "stranger@example.com",
					emailVerified: true,
				},
				{ method: "oauth", oauth: { providerId: "google" } },
			),
		);
		await assert.rejects(() =>
			context.internalAdapter.createUser(
				{
					name: "False owner",
					email: "owner@example.com",
					emailVerified: false,
				},
				{ method: "oauth", oauth: { providerId: "google" } },
			),
		);
		const token = await store.invite(owner.id, "viewer@example.com");
		assert.equal(
			await store.mayRegister("viewer@example.com", true, token),
			true,
		);
		assert.equal(
			await store.mayRegister("other@example.com", true, token),
			false,
		);
		assert.equal(
			await store.mayRegister("viewer@example.com", false, token),
			false,
		);
		// User insertion here represents provider-verified identity; session admission is tested independently below.
		await pool.query(
			'INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES($1,$2,$3,true,now(),now())',
			["viewer", "Viewer", "viewer@example.com"],
		);
		assert.equal(await store.admit("viewer", token), true);
		assert.equal(
			(
				await store.access({
					id: "viewer",
					name: "Viewer",
					email: "viewer@example.com",
				})
			)?.role,
			"viewer",
		);
		assert.equal(
			await store.mayRegister("viewer@example.com", true, token),
			false,
		);
		await assert.rejects(() => store.invite("viewer", "another@example.com"));
		await context.internalAdapter.createSession("viewer");
		await store.revoke(owner.id, "viewer", "member");
		assert.equal(
			await store.access({
				id: "viewer",
				name: "Viewer",
				email: "viewer@example.com",
			}),
			null,
		);
		assert.equal(await store.admit("viewer", token), false);
		assert.equal(
			(await pool.query('SELECT id FROM session WHERE "userId"=$1', ["viewer"]))
				.rowCount,
			0,
		);
		const replacement = await store.invite(owner.id, "viewer@example.com");
		assert.equal(await store.admit("viewer", replacement), true);
		await assert.rejects(() => store.revoke(owner.id, owner.id, "member"));
		const expired = await store.invite(owner.id, "expired@example.com");
		await pool.query(
			"UPDATE backoffice_invitation SET expires_at=now()-interval '1 minute' WHERE email='expired@example.com'",
		);
		assert.equal(
			await store.mayRegister("expired@example.com", true, expired),
			false,
		);
		assert.ok(
			(await pool.query("SELECT id FROM backoffice_access_audit")).rowCount,
		);
		const unauthenticated = await auth.handler(
			new Request("http://localhost:3971/api/auth/get-session"),
		);
		assert.equal(await unauthenticated.json(), null);
		const csrf = await auth.handler(
			new Request("http://localhost:3971/api/auth/sign-out", {
				method: "POST",
				headers: {
					origin: "https://attacker.example",
					cookie: "backoffice.session_token=fixture-invalid",
					"content-type": "application/json",
				},
				body: "{}",
			}),
		);
		assert.equal(csrf.status, 403);
	} finally {
		await pool.end();
	}
});
