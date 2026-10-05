import { readFile } from "node:fs/promises";
import { getMigrations } from "better-auth/db/migration";
import { readAuthConfiguration } from "../src/features/auth/config.ts";
import { createAuthRuntime } from "../src/features/auth/runtime.ts";
let runtime: ReturnType<typeof createAuthRuntime> | undefined;
try {
	runtime = createAuthRuntime(readAuthConfiguration(process.env));
	const { pool, options } = runtime;
	const migrations = await getMigrations(options);
	await migrations.runMigrations();
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await client.query("SELECT pg_advisory_xact_lock(183542029)");
		await client.query(
			await readFile(
				new URL("../migrations/001-access.sql", import.meta.url),
				"utf8",
			),
		);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
	console.log("Authentication schema is ready.");
} catch {
	console.error(
		"Authentication migration failed; inspect configuration and database access.",
	);
	process.exitCode = 1;
} finally {
	await runtime?.pool.end();
}
