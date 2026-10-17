import path from "node:path";
import ts from "@typescript/typescript6";
const within = (file: string, directory: string) =>
	file === directory || file.startsWith(directory + path.sep);
export function boundaryErrors(file: string, source: string) {
	const filename = path.resolve(file);
	const relative = path.relative(path.resolve("src/features"), filename);
	const name = relative.split(path.sep)[0];
	const feature = path.resolve(
		"src/features",
		name && name !== ".." ? name : "operations",
	);
	const domain = within(filename, path.join(feature, "domain"));
	const application = within(filename, path.join(feature, "application"));
	const presentation = within(filename, path.join(feature, "presentation"));
	const adapter = within(filename, path.join(feature, "adapters"));
	const tree = ts.createSourceFile(
		filename,
		source,
		ts.ScriptTarget.Latest,
		true,
	);
	const client = hasDirective(tree, "use client");
	const errors: string[] = [];
	function dependency(specifier: unknown) {
		if (typeof specifier !== "string") {
			if (domain || application || presentation)
				errors.push("computed dependency");
			return;
		}
		const destination = specifier.startsWith(".")
			? path.resolve(path.dirname(filename), specifier)
			: null;
		if (
			client &&
			(specifier === "server-only" ||
				specifier.startsWith("node:") ||
				specifier === "next/headers" ||
				(destination &&
					/features[/\\]auth[/\\](server|config|database|runtime|store)(?:\.|$)/.test(
						destination,
					)))
		)
			errors.push("client server dependency");
		if (
			domain &&
			(!destination || !within(destination, path.join(feature, "domain")))
		)
			errors.push("domain dependency");
		if (
			application &&
			(!destination ||
				!["application", "domain"].some((layer) =>
					within(destination, path.join(feature, layer)),
				))
		)
			errors.push("application dependency");
		if (
			presentation &&
			((destination && within(destination, path.join(feature, "adapters"))) ||
				specifier === "server-only" ||
				specifier.startsWith("node:"))
		)
			errors.push("presentation infrastructure dependency");
		if (
			adapter &&
			destination &&
			(within(destination, path.join(feature, "presentation")) ||
				destination.replace(/\.tsx?$/, "") === path.join(feature, "entry"))
		)
			errors.push("adapter outer dependency");
		if (
			!adapter &&
			destination &&
			within(destination, path.resolve("contracts"))
		)
			errors.push("wire schema dependency");
	}
	function inspect(node: ts.Node) {
		if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
			if (node.moduleSpecifier)
				dependency(
					ts.isStringLiteral(node.moduleSpecifier)
						? node.moduleSpecifier.text
						: null,
				);
		}
		if (
			ts.isCallExpression(node) &&
			(node.expression.kind === ts.SyntaxKind.ImportKeyword ||
				(ts.isIdentifier(node.expression) &&
					node.expression.text === "require"))
		) {
			const argument = node.arguments[0];
			dependency(
				argument && ts.isStringLiteral(argument) ? argument.text : null,
			);
		}
		if (ts.isImportTypeNode(node)) {
			const argument = node.argument;
			dependency(
				ts.isLiteralTypeNode(argument) && ts.isStringLiteral(argument.literal)
					? argument.literal.text
					: null,
			);
		}
		if (
			ts.isImportEqualsDeclaration(node) &&
			ts.isExternalModuleReference(node.moduleReference)
		) {
			const expression = node.moduleReference.expression;
			dependency(
				expression && ts.isStringLiteral(expression) ? expression.text : null,
			);
		}
		if (
			application &&
			ts.isIdentifier(node) &&
			[
				"window",
				"document",
				"navigator",
				"fetch",
				"localStorage",
				"sessionStorage",
				"process",
				"globalThis",
				"FormData",
				"Headers",
				"Request",
				"Response",
			].includes(node.text)
		)
			errors.push("application platform global");
		if (
			domain &&
			ts.isIdentifier(node) &&
			[
				"window",
				"document",
				"navigator",
				"fetch",
				"AbortController",
				"AbortSignal",
				"localStorage",
				"sessionStorage",
				"process",
				"ReadableStream",
				"TextDecoder",
				"setTimeout",
				"globalThis",
				"FormData",
				"Headers",
				"Request",
				"Response",
			].includes(node.text)
		)
			errors.push("domain platform global");
		ts.forEachChild(node, inspect);
	}
	inspect(tree);
	for (const name of source.match(/NEXT_PUBLIC_[A-Z_]+/g) ?? [])
		errors.push(`public environment variable: ${name}`);
	return errors;
}

function hasDirective(tree: ts.SourceFile, directive: string): boolean {
	for (const statement of tree.statements) {
		if (
			!ts.isExpressionStatement(statement) ||
			!ts.isStringLiteral(statement.expression)
		)
			return false;
		if (statement.expression.text === directive) return true;
	}
	return false;
}

export function moduleGraphErrors(sources: Record<string, string>): string[] {
	const modules = new Map(
		Object.entries(sources).map(([file, source]) => [
			path.resolve(file),
			source,
		]),
	);
	const graph = new Map<string, string[]>();
	const clients = new Set<string>();
	const actions = new Set<string>();
	const serverModules = new Set<string>();
	const computedModules = new Set<string>();
	const errors: string[] = [];
	for (const [file, source] of modules) {
		const edges: string[] = [];
		const tree = ts.createSourceFile(
			file,
			source,
			ts.ScriptTarget.Latest,
			true,
		);
		if (hasDirective(tree, "use client")) clients.add(file);
		if (hasDirective(tree, "use server")) actions.add(file);
		function inspect(node: ts.Node) {
			let specifier: string | undefined;
			if (
				(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
				node.moduleSpecifier &&
				ts.isStringLiteral(node.moduleSpecifier)
			)
				specifier = node.moduleSpecifier.text;
			if (
				ts.isImportTypeNode(node) &&
				ts.isLiteralTypeNode(node.argument) &&
				ts.isStringLiteral(node.argument.literal)
			)
				specifier = node.argument.literal.text;
			if (
				ts.isCallExpression(node) &&
				(node.expression.kind === ts.SyntaxKind.ImportKeyword ||
					(ts.isIdentifier(node.expression) &&
						node.expression.text === "require"))
			) {
				const argument = node.arguments[0];
				if (argument && ts.isStringLiteral(argument)) specifier = argument.text;
				else computedModules.add(file);
			}
			if (
				ts.isImportEqualsDeclaration(node) &&
				ts.isExternalModuleReference(node.moduleReference)
			) {
				const expression = node.moduleReference.expression;
				if (expression && ts.isStringLiteral(expression))
					specifier = expression.text;
			}
			if (
				specifier === "server-only" ||
				specifier?.startsWith("node:") ||
				specifier === "pg" ||
				specifier === "better-auth"
			)
				serverModules.add(file);
			if (specifier?.startsWith(".")) {
				const base = path.resolve(path.dirname(file), specifier);
				const target = [
					base,
					`${base}.ts`,
					`${base}.tsx`,
					base.replace(/\.js$/, ".ts"),
					base.replace(/\.jsx$/, ".tsx"),
					path.join(base, "index.ts"),
					path.join(base, "index.tsx"),
				].find((candidate) => modules.has(candidate));
				if (target) edges.push(target);
			}
			ts.forEachChild(node, inspect);
		}
		inspect(tree);
		graph.set(file, edges);
	}
	const visited = new Set<string>();
	const stack = new Set<string>();
	function visit(file: string) {
		if (stack.has(file)) {
			errors.push(`import cycle: ${path.relative(process.cwd(), file)}`);
			return;
		}
		if (visited.has(file)) return;
		stack.add(file);
		for (const target of graph.get(file) ?? []) visit(target);
		stack.delete(file);
		visited.add(file);
	}
	for (const file of modules.keys()) visit(file);
	for (const file of clients) {
		const seen = new Set<string>();
		function inspectClient(target: string) {
			if (seen.has(target)) return;
			seen.add(target);
			// Next turns explicitly marked Server Actions into RPC references.
			if (actions.has(target)) return;
			if (computedModules.has(target))
				errors.push(
					`client computed dependency: ${path.relative(process.cwd(), target)}`,
				);
			if (serverModules.has(target))
				errors.push(
					`client reaches server module: ${path.relative(process.cwd(), file)} -> ${path.relative(process.cwd(), target)}`,
				);
			for (const child of graph.get(target) ?? []) inspectClient(child);
		}
		inspectClient(file);
	}
	return errors;
}
