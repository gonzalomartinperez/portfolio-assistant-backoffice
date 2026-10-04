import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { boundaryErrors } from "../../scripts/check-boundaries.ts";
test("source dependency boundaries and public environment allowlist", () => {
	for (const file of readdirSync("src", {
		recursive: true,
		encoding: "utf8",
	}).filter((file) => /\.(ts|tsx)$/.test(file))) {
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

test("owned application, fixtures and tooling remain type-checked TypeScript", () => {
	for (const directory of ["src", "scripts", "tests"]) {
		const javascript = readdirSync(directory, {
			recursive: true,
			encoding: "utf8",
		}).filter((file) => /\.(?:cjs|mjs|js|jsx)$/.test(file));
		assert.deepEqual(
			javascript,
			[],
			`${directory}: authored JavaScript needs an explicit compatibility decision`,
		);
	}
});

test("client boundaries reject authentication infrastructure imports", () => {
	for (const module of ["server", "config", "database", "runtime", "store"]) {
		assert.notEqual(
			boundaryErrors(
				"src/components/example.tsx",
				`"use client"; import x from "../features/auth/${module}"`,
			).length,
			0,
			module,
		);
	}
});
