import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import { secretDetectors } from "./secret-patterns.ts";
import { checkSecretHistory } from "./check-secret-history.ts";
const files = [
	...new Set(
		execFileSync(
			"git",
			["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
			{ encoding: "utf8" },
		)
			.split("\0")
			.filter(Boolean),
	),
];
let findings = 0;
let checked = 0;
for (const file of files) {
	if (!existsSync(file) || !statSync(file).isFile()) continue;
	if (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".example")) {
		console.error(`environment-file: ${file} (contents redacted)`);
		findings++;
		continue;
	}
	const bytes = readFileSync(file);
	if (bytes.includes(0)) continue;
	checked++;
	const text = bytes.toString("utf8");
	for (const name of secretDetectors(text)) {
		console.error(`${name}: ${file} (matched value redacted)`);
		findings++;
	}
}
try {
	const history = checkSecretHistory((object, detector) => {
		console.error(
			`${detector}: history object ${object} (matched value redacted)`,
		);
	});
	findings += history.findings;
	console.log(`Git history scan: ${history.blobs} reachable blobs checked.`);
} catch {
	console.error("Git history scan could not complete (details redacted).");
	findings++;
}
console.log(
	`Public-file scan: ${checked} text files, ${findings} findings. High-confidence patterns only; not a complete secret audit.`,
);
if (findings) process.exitCode = 1;
