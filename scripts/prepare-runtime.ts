import {
	cp,
	mkdir,
	readFile,
	realpath,
	stat,
	writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import ts from "@typescript/typescript6";
import { nodeFileTrace } from "@vercel/nft";

const optionalImports = [
	["pg-native", "/node_modules/pg/lib/native/client.js"],
	["cloudflare:sockets", "/node_modules/pg-cloudflare/dist/index.js"],
	[
		"@opentelemetry/api",
		"/node_modules/@better-auth/core/dist/instrumentation/api.mjs",
	],
] as const;

export function optionalTraceWarning(message: string): boolean {
	return optionalImports.some(
		([name, importer]) =>
			message.startsWith(`Failed to resolve dependency "${name}":\n`) &&
			message.endsWith(importer),
	);
}

export function runtimeTracePath(path: string): string {
	if (
		isAbsolute(path) ||
		path.includes("\\") ||
		path
			.split("/")
			.some((part) => part === ".." || part === "." || part === "") ||
		!(
			/^(node_modules\/|src\/features\/auth\/)/.test(path) ||
			[
				"scripts/auth-migrate.ts",
				"package.json",
				"migrations/001-access.sql",
			].includes(path)
		) ||
		/\.(pem|key|p12|pfx)$/.test(path) ||
		path.split("/").some((part) => part.startsWith(".env"))
	)
		throw new Error("Unexpected migration trace path.");
	return path;
}

export async function prepareRuntime(root = process.cwd()) {
	const base = await realpath(root);
	const target = resolve(base, ".next/standalone");
	await stat(resolve(target, "server.js"));
	const trace = await nodeFileTrace(
		[resolve(base, "scripts/auth-migrate.ts")],
		{
			base,
			processCwd: base,
			fileIOConcurrency: 32,
			readFile: async (path) => {
				let source: string;
				try {
					source = await readFile(path, "utf8");
				} catch (error) {
					if (
						error instanceof Error &&
						"code" in error &&
						(error.code === "ENOENT" || error.code === "EISDIR")
					)
						return null;
					throw error;
				}
				if (!path.endsWith(".ts") || path.endsWith(".d.ts")) return source;
				return ts.transpileModule(source, {
					compilerOptions: {
						module: ts.ModuleKind.ESNext,
						target: ts.ScriptTarget.ESNext,
					},
					fileName: path,
				}).outputText;
			},
		},
	);
	if (
		[...trace.warnings].some(
			(warning) => !optionalTraceWarning(warning.message),
		)
	)
		throw new Error("Migration trace has an unexpected unresolved dependency.");
	const files = [...trace.fileList].map(runtimeTracePath).sort();
	if (
		!files.includes("scripts/auth-migrate.ts") ||
		!files.includes("migrations/001-access.sql")
	)
		throw new Error("Migration trace is incomplete.");
	let addedBytes = 0;
	for (const file of files) {
		const source = await realpath(resolve(base, file));
		if (relative(base, source).startsWith(".."))
			throw new Error("Migration trace escaped the build root.");
		const destination = resolve(target, file);
		try {
			await stat(destination);
			continue;
		} catch (error) {
			if (
				!(error instanceof Error && "code" in error && error.code === "ENOENT")
			)
				throw error;
		}
		await mkdir(dirname(destination), { recursive: true });
		await cp(source, destination, { dereference: true });
		addedBytes += (await stat(source)).size;
	}
	const report = {
		schema_version: 1,
		entry: "scripts/auth-migrate.ts",
		files: files.length,
		added_bytes: addedBytes,
	};
	await writeFile(
		resolve(target, "runtime-trace.json"),
		`${JSON.stringify(report)}\n`,
	);
	console.log(
		`Prepared migration runtime: ${files.length} traced files; ${addedBytes} added bytes.`,
	);
	return report;
}

if (import.meta.main) await prepareRuntime();
