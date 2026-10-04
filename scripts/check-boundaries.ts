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
		name && name !== ".." ? name : "assistant",
	);
	const domain = within(filename, path.join(feature, "domain"));
	const application = within(filename, path.join(feature, "application"));
	const presentation = within(filename, path.join(feature, "presentation"));
	const adapter = within(filename, path.join(feature, "adapters"));
	const client = /^\s*["']use client["']/.test(source);
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
			!adapter &&
			destination &&
			within(destination, path.resolve("contracts"))
		)
			errors.push("wire schema dependency");
	}
	const tree = ts.createSourceFile(
		filename,
		source,
		ts.ScriptTarget.Latest,
		true,
	);
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
			].includes(node.text)
		)
			errors.push("domain platform global");
		ts.forEachChild(node, inspect);
	}
	inspect(tree);
	for (const name of source.match(/NEXT_PUBLIC_[A-Z_]+/g) ?? [])
		if (name !== "NEXT_PUBLIC_ASSISTANT_API_URL")
			errors.push("public environment variable");
	return errors;
}
