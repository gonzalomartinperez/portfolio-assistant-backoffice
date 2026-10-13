import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
const files = [
	...new Set(
		execFileSync(
			"git",
			["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
			{ encoding: "utf8" },
		).split("\0"),
	),
].filter((file) => file.endsWith(".md") && existsSync(file));
let count = 0;
let missing = 0;
for (const file of files) {
	const source = readFileSync(file, "utf8");
	const references = [
		...source.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g),
		...source.matchAll(/(?:src|href)="([^"]+)"/g),
	];
	for (const match of references) {
		const target = match[1];
		if (!target) continue;
		if (/^(?:https?:|mailto:|#)/.test(target)) continue;
		const pathname = decodeURIComponent(target.split("#")[0] ?? "");
		if (!pathname) continue;
		count++;
		if (!existsSync(path.resolve(path.dirname(file), pathname))) {
			console.error(`Missing local documentation target: ${file} → ${target}`);
			missing++;
		}
	}
}
console.log(`Documentation: ${count} local links checked, ${missing} missing.`);
if (missing) process.exitCode = 1;
