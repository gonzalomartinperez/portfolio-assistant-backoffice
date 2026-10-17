import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scanner = fileURLToPath(
	new URL("../../scripts/check-public-files.ts", import.meta.url),
);
const marker = ["gh", "p_", "SyntheticOnly".repeat(4)].join("");

test("secret scan catches ignored tracked files, deleted history and unmerged branches without printing values", () => {
	const directory = mkdtempSync(path.join(tmpdir(), "backoffice-secret-scan-"));
	const git = (...args: string[]) =>
		execFileSync("git", args, { cwd: directory, stdio: "pipe" });
	const scan = () =>
		spawnSync(process.execPath, [scanner], {
			cwd: directory,
			encoding: "utf8",
		});
	const rejected = () => {
		const result = scan();
		assert.equal(result.status, 1);
		assert.match(result.stderr, /github-token/);
		assert.ok(!`${result.stdout}${result.stderr}`.includes(marker));
	};
	try {
		git("init", "--initial-branch=fixture");
		git("config", "user.name", "Synthetic fixture");
		git("config", "user.email", "fixture@example.test");
		writeFileSync(path.join(directory, "README.md"), "Synthetic fixture\n");
		git("add", "README.md");
		git("commit", "-m", "fixture: baseline");
		assert.equal(scan().status, 0);
		writeFileSync(path.join(directory, ".gitignore"), "ignored.txt\n");
		writeFileSync(path.join(directory, "ignored.txt"), marker);
		git("add", "--force", "ignored.txt");
		rejected();
		git("commit", "-m", "fixture: synthetic marker");
		git("rm", "ignored.txt");
		git("commit", "-m", "fixture: remove marker");
		rejected();
		git("branch", "unmerged-marker");
		git("switch", "--orphan", "clean-fixture");
		writeFileSync(path.join(directory, "README.md"), "Clean fixture\n");
		git("add", "README.md");
		git("commit", "-m", "fixture: clean unrelated branch");
		rejected();
		const shallow = path.join(directory, "shallow-fixture");
		git("clone", "--depth=1", pathToFileURL(directory).href, shallow);
		const incomplete = spawnSync(process.execPath, [scanner], {
			cwd: shallow,
			encoding: "utf8",
		});
		assert.equal(incomplete.status, 1);
		assert.match(incomplete.stderr, /history scan could not complete/);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});

test("history verification fails closed outside a Git repository", () => {
	const directory = mkdtempSync(path.join(tmpdir(), "backoffice-no-git-"));
	try {
		const result = spawnSync(process.execPath, [scanner], {
			cwd: directory,
			encoding: "utf8",
		});
		assert.notEqual(result.status, 0);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
