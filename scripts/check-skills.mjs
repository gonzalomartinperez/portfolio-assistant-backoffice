import {
	readFileSync,
	readdirSync,
	lstatSync,
	realpathSync,
	readlinkSync,
	existsSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { load, FAILSAFE_SCHEMA } from "js-yaml";

export function validateSkills(directoryRoot) {
	const root = realpathSync(directoryRoot);
	const errors = [];
	const names = new Set();
	const canonical = path.join(root, ".claude/skills");
	const discovery = path.join(root, ".agents/skills");
	const packages = JSON.parse(
		readFileSync(path.join(root, "package.json"), "utf8"),
	);
	const inside = (target) =>
		target === root || target.startsWith(root + path.sep);
	const fail = (file, message) =>
		errors.push(`${path.relative(root, file)}: ${message}`);
	const folders = existsSync(canonical) ? readdirSync(canonical) : [];
	if (!folders.length) errors.push("No canonical skills found");
	for (const folder of folders) {
		const directory = path.join(canonical, folder);
		const entry = path.join(directory, "SKILL.md");
		try {
			if (!lstatSync(directory).isDirectory())
				throw new Error("Canonical skill must be a real directory");
			const source = readFileSync(entry, "utf8");
			const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(source);
			if (!match) throw new Error("Missing YAML frontmatter or skill body");
			const meta = load(match[1], { schema: FAILSAFE_SCHEMA });
			if (!meta || typeof meta !== "object" || Array.isArray(meta))
				throw new Error("Frontmatter must be a mapping");
			if (
				Object.keys(meta).some((key) => !["name", "description"].includes(key))
			)
				throw new Error(
					"Only portable name/description metadata is supported here",
				);
			if (
				typeof meta.name !== "string" ||
				!/^web-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.name) ||
				meta.name.length > 64
			)
				throw new Error("Invalid namespaced name");
			if (names.has(meta.name)) throw new Error("Duplicate discovered name");
			names.add(meta.name);
			if (meta.name !== folder)
				throw new Error("Directory and skill name differ");
			if (
				typeof meta.description !== "string" ||
				!meta.description.trim() ||
				meta.description.length > 1024
			)
				throw new Error("Invalid description");
			const link = path.join(discovery, folder);
			if (
				!lstatSync(link).isSymbolicLink() ||
				path.isAbsolute(readlinkSync(link)) ||
				realpathSync(link) !== directory
			)
				throw new Error(
					"Codex discovery must be a relative directory symlink to its canonical skill",
				);
			inspect(directory);
		} catch (error) {
			fail(entry, error.message);
		}
	}
	if (
		!existsSync(discovery) ||
		readdirSync(discovery).sort().join() !== folders.sort().join()
	)
		errors.push("Client discovery catalogs differ");
	if (
		readFileSync(path.join(root, "CLAUDE.md"), "utf8").trim() !== "@AGENTS.md"
	)
		errors.push("Claude entry must import the canonical AGENTS.md only");
	return { names: [...names].sort(), errors };

	function inspect(directory) {
		const entries = readdirSync(directory);
		if (!entries.length) fail(directory, "Empty scaffold directory");
		for (const name of entries) {
			const file = path.join(directory, name);
			const stat = lstatSync(file);
			if (stat.isSymbolicLink()) {
				fail(file, "Canonical resources cannot be symlinks");
				continue;
			}
			if (stat.isDirectory()) {
				inspect(file);
				continue;
			}
			const source = readFileSync(file, "utf8");
			if (/\b(?:TODO|FIXME|TBD)\b|\[INSERT\b|<skill-name>/.test(source))
				fail(file, "Unfinished scaffold");
			if (
				/(?:\/home\/|\/Users\/|\/mnt\/[cd]\/|[A-Z]:\\Users\\|~\/|\$HOME\b)/.test(
					source,
				)
			)
				fail(file, "Machine-specific or global path");
			if (!file.endsWith(".md")) continue;
			for (const match of source.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)) {
				const ref = match[1];
				if (/^(https?:|#)/.test(ref)) continue;
				const target = path.resolve(
					path.dirname(file),
					decodeURIComponent(ref.split("#")[0]),
				);
				if (
					!inside(target) ||
					!existsSync(target) ||
					!inside(realpathSync(target))
				)
					fail(file, `Missing or external reference: ${ref}`);
			}
			for (const match of source.matchAll(/\bnpm run ([a-z][a-z0-9:-]*)/g)) {
				if (!(match[1] in packages.scripts))
					fail(file, `Unknown npm command: ${match[1]}`);
			}
			for (const match of source.matchAll(
				/`(?:(node|bash) )?((?:\.\/)?scripts\/[\w./-]+)(?:[^`]*)`/g,
			)) {
				const target = path.resolve(root, match[2]);
				if (!inside(target) || !existsSync(target))
					fail(file, `Missing executable resource: ${match[2]}`);
				else if (!match[1] && !(lstatSync(target).mode & 0o111))
					fail(file, "Directly invoked script is not executable");
				else if (
					(match[1] === "node" && !/\.(mjs|js)$/.test(target)) ||
					(match[1] === "bash" && !target.endsWith(".sh"))
				)
					fail(file, "Unsupported script invocation");
			}
		}
	}
}
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
	const result = validateSkills(process.argv[2] ?? process.cwd());
	for (const error of result.errors) console.error(error);
	console.log(
		`Skills: ${result.names.length} canonical entries, ${result.errors.length} errors.`,
	);
	if (result.errors.length) process.exitCode = 1;
}
