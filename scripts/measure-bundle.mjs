import { readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
const files = readdirSync(".next/static/chunks", { recursive: true }).filter(
	(file) => file.endsWith(".js"),
);
const total = files.reduce(
	(result, file) => {
		const bytes = readFileSync(`.next/static/chunks/${file}`);
		return {
			bytes: result.bytes + bytes.length,
			gzip: result.gzip + gzipSync(bytes).length,
		};
	},
	{ bytes: 0, gzip: 0 },
);
console.log(JSON.stringify(total, null, 2));
