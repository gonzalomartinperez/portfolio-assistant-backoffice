import test from "node:test";
import assert from "node:assert/strict";
import {
	mkdtempSync,
	cpSync,
	writeFileSync,
	rmSync,
	readFileSync,
	unlinkSync,
	symlinkSync,
	mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { validateSkills } from "../../scripts/check-skills.ts";

test("canonical catalog and relative client discovery resolve", () => {
	assert.deepEqual(validateSkills(process.cwd()).errors, []);
});
test("catalog rejects drift, escapes, malformed metadata and stale commands", () => {
	const root = mkdtempSync(path.join(tmpdir(), "web-skill-validator-"));
	try {
		for (const name of [
			".claude",
			".agents",
			"AGENTS.md",
			"CLAUDE.md",
			"package.json",
			"src",
			"docs",
			"scripts",
			"tests",
			"contracts",
			"README.md",
			"CONTRIBUTING.md",
			"Dockerfile",
		])
			cpSync(name, path.join(root, name), {
				recursive: true,
				verbatimSymlinks: true,
			});
		assert.deepEqual(validateSkills(root).errors, []);
		const entry = path.join(
			root,
			".claude/skills/web-change-assistant/SKILL.md",
		);
		const original = readFileSync(entry, "utf8");
		for (const [change, expected] of [
			[
				original.replace("name: web-change-assistant", "name: [broken]"),
				/Invalid namespaced/,
			],
			[
				original.replace(
					"name: web-change-assistant",
					"name: web-change-assistant\nname: duplicate",
				),
				/duplicated mapping key/,
			],
			[`${original}\n[missing](references/missing.md)`, /Missing or external/],
			[`${original}\n[outside](../../../../outside.md)`, /Missing or external/],
			[`${original}\nnpm run invented-command`, /Unknown npm/],
			[`${original}\nTODO`, /Unfinished/],
			[`${original}\n/home/example/private`, /Machine-specific/],
		] satisfies Array<[string, RegExp]>) {
			writeFileSync(entry, change);
			assert.match(validateSkills(root).errors.join("\n"), expected);
		}
		writeFileSync(entry, original);
		mkdirSync(
			path.join(root, ".claude/skills/web-change-assistant/references"),
		);
		assert.match(validateSkills(root).errors.join("\n"), /Empty scaffold/);
		rmSync(path.join(root, ".claude/skills/web-change-assistant/references"), {
			recursive: true,
		});
		const link = path.join(root, ".agents/skills/web-change-assistant");
		unlinkSync(link);
		symlinkSync("../../.claude/skills/web-refresh-contract", link);
		assert.match(
			validateSkills(root).errors.join("\n"),
			/relative directory symlink/,
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
