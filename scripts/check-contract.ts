import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { record, text } from "./json.ts";
const source = record(
	JSON.parse(readFileSync("contracts/source.json", "utf8")),
);
for (const [file, expected] of [
	["openapi.json", text(source.openapi_sha256)],
	["sse.schema.json", text(source.sse_sha256)],
	["sse.examples.json", text(source.sse_examples_sha256)],
]) {
	const actual = createHash("sha256")
		.update(readFileSync(`contracts/${file}`))
		.digest("hex");
	if (actual !== expected)
		throw new Error(
			`${file} differs from API commit ${text(source.api_commit)}`,
		);
}
console.log(
	`Historical public contract matches API ${text(source.api_commit)}`,
);

const operations = record(
	JSON.parse(readFileSync("contracts/operations.source.json", "utf8")),
);
for (const file of ["operations.schema.json", "operations.example.json"]) {
	const expected = text(operations[`${file.replaceAll(".", "_")}_sha256`]);
	const actual = createHash("sha256")
		.update(readFileSync(`contracts/${file}`))
		.digest("hex");
	if (actual !== expected)
		throw new Error(
			`${file} differs from operations API ${text(operations.api_commit)}`,
		);
}
console.log(
	`Private operations contract matches API ${text(operations.api_commit)}`,
);
