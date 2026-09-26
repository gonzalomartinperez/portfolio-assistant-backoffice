import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const source = JSON.parse(readFileSync("contracts/source.json", "utf8"));
for (const [file, expected] of [
	["openapi.json", source.openapi_sha256],
	["sse.schema.json", source.sse_sha256],
]) {
	const actual = createHash("sha256")
		.update(readFileSync(`contracts/${file}`))
		.digest("hex");
	if (actual !== expected)
		throw new Error(`${file} differs from API commit ${source.api_commit}`);
}
console.log(`Contract snapshot matches API ${source.api_commit}`);
