import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "@typescript/typescript6";
const primary = JSON.parse(
	readFileSync(
		new URL("../node_modules/typescript/package.json", import.meta.url),
		"utf8",
	),
);
assert.equal(primary.version, "7.0.2");
const version = execFileSync(
	process.execPath,
	["node_modules/typescript/lib/tsc.js", "--version"],
	{ encoding: "utf8" },
).trim();
assert.equal(version, "Version 7.0.2");
assert.ok(ts.version.startsWith("6."));
console.log(
	`Primary checker: ${version}; compiler API compatibility: ${ts.version}`,
);
