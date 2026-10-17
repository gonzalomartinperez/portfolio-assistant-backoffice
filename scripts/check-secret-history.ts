import { execFileSync } from "node:child_process";
import { secretDetectors } from "./secret-patterns.ts";

export function checkSecretHistory(
	report: (object: string, detector: string) => void,
): { blobs: number; findings: number } {
	if (
		execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
			encoding: "utf8",
		}).trim() !== "false"
	)
		throw new Error("Complete Git history is required for secret verification");
	const objects = execFileSync(
		"git",
		["rev-list", "--objects", "--all", "--no-object-names"],
		{ encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
	).trim();
	if (!objects) return { blobs: 0, findings: 0 };
	const info = execFileSync("git", ["cat-file", "--batch-check"], {
		input: `${objects}\n`,
		encoding: "utf8",
		maxBuffer: 64 * 1024 * 1024,
	});
	let blobs = 0;
	let findings = 0;
	for (const line of info.trim().split("\n")) {
		const [object, kind] = line.split(" ");
		if (kind !== "blob" || !object) continue;
		const text = execFileSync("git", ["cat-file", "blob", object], {
			encoding: "utf8",
			maxBuffer: 64 * 1024 * 1024,
		});
		blobs++;
		for (const detector of secretDetectors(text)) {
			report(object, detector);
			findings++;
		}
	}
	return { blobs, findings };
}
