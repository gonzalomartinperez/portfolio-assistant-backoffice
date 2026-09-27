import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { boundaryErrors } from "../../scripts/check-boundaries.mjs";
test("source dependency boundaries and public environment allowlist", () => {
	for (const file of readdirSync("src", { recursive: true }).filter((file) =>
		/\.(ts|tsx)$/.test(file),
	)) {
		const name = `src/${file}`;
		assert.deepEqual(
			boundaryErrors(name, readFileSync(name, "utf8")),
			[],
			name,
		);
	}
});
test("boundaries resolve traversal and inspect dynamic and type-only imports", () => {
	const domain = "src/features/assistant/domain/example.ts";
	for (const source of [
		'import x from "./../adapters/api"',
		'const x=import("../adapters/api")',
		'type X=import("../adapters/api").X',
		'const x=require("react")',
		"const x=import(destination)",
	])
		assert.notEqual(boundaryErrors(domain, source).length, 0, source);
	assert.deepEqual(
		boundaryErrors(domain, 'import type {Message} from "./models"'),
		[],
	);
	assert.notEqual(
		boundaryErrors(
			"src/features/assistant/application/example.ts",
			'import x from "./../presentation/chat"',
		).length,
		0,
	);
});
