import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	optionalTraceWarning,
	prepareRuntime,
	runtimeTracePath,
} from "../../scripts/prepare-runtime.ts";

test("runtime trace rejects private files and escapes while accepting migration dependencies", () => {
	for (const path of [
		"/etc/passwd",
		"../package.json",
		"node_modules/../secret",
		"src/.env",
		"node_modules/a/.env.local",
		"node_modules/a/private.key",
		"scripts/auth-fixture-session.ts",
		"src/features/operations/fixture.ts",
		"node_modules\\a",
	]) {
		assert.throws(() => runtimeTracePath(path));
	}
	for (const path of [
		"scripts/auth-migrate.ts",
		"migrations/001-access.sql",
		"src/features/auth/runtime.ts",
		"node_modules/pg/package.json",
	]) {
		assert.equal(runtimeTracePath(path), path);
	}
});

test("only reviewed optional driver and disabled instrumentation imports may be unresolved", () => {
	assert.equal(
		optionalTraceWarning(
			'Failed to resolve dependency "pg-native":\nCannot find module loaded from /app/node_modules/pg/lib/native/client.js',
		),
		true,
	);
	for (const warning of [
		'Failed to resolve dependency "pg":\nCannot find module pg',
		'Failed to resolve dependency "pg-native":\n/app/node_modules/pg/lib/client.js',
		"Failed to parse migration.ts",
	]) {
		assert.equal(optionalTraceWarning(warning), false);
	}
});

async function fixture(run: (root: string) => Promise<void>) {
	const root = await mkdtemp(join(tmpdir(), "backoffice-runtime-test-"));
	try {
		for (const path of [
			"scripts",
			"src/features/auth",
			"migrations",
			".next/standalone",
		])
			await mkdir(join(root, path), { recursive: true });
		await writeFile(join(root, "package.json"), '{"type":"module"}');
		await writeFile(
			join(root, ".next/standalone/server.js"),
			"// Isolated trace fixture.\n",
		);
		await writeFile(join(root, "migrations/001-access.sql"), "SELECT 1;");
		await writeFile(
			join(root, "src/features/auth/config.ts"),
			"export const version: number = 1;",
		);
		await writeFile(
			join(root, "scripts/auth-migrate.ts"),
			'import {readFile} from "node:fs/promises";\nimport {version} from "../src/features/auth/config.ts";\nconst value: number = version;\nawait readFile(new URL("../migrations/001-access.sql", import.meta.url), "utf8");\nconsole.log(value);',
		);
		await run(root);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}

test("traces native TypeScript and SQL without shipping its build compiler", async () => {
	await fixture(async (root) => {
		const report = await prepareRuntime(root);
		assert.ok(report.added_bytes > 0);
		assert.match(
			await readFile(
				join(root, ".next/standalone/src/features/auth/config.ts"),
				"utf8",
			),
			/version: number/,
		);
		assert.equal(
			await readFile(
				join(root, ".next/standalone/migrations/001-access.sql"),
				"utf8",
			),
			"SELECT 1;",
		);
		assert.equal((await prepareRuntime(root)).added_bytes, 0);
	});
});

test("an unresolved required dependency prevents packaging a migration", async () => {
	await fixture(async (root) => {
		await writeFile(
			join(root, "scripts/auth-migrate.ts"),
			'import "unavailable-required-module";',
		);
		await assert.rejects(
			prepareRuntime(root),
			/unexpected unresolved dependency/,
		);
	});
});
