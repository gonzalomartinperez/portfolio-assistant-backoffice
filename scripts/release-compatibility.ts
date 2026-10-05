import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

interface ContractSource {
	api_commit: string;
	openapi_sha256: string;
}

export function releaseCompatibility(
	commit: string,
	image: string,
	source: unknown,
) {
	if (!/^[a-f0-9]{40}$/.test(commit))
		throw new Error("Invalid source revision");
	if (!/^ghcr\.io\/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$/.test(image))
		throw new Error("A published immutable GHCR image digest is required");
	if (
		typeof source !== "object" ||
		source === null ||
		!("api_commit" in source) ||
		typeof source.api_commit !== "string" ||
		!/^[a-f0-9]{40}$/.test(source.api_commit) ||
		!("openapi_sha256" in source) ||
		typeof source.openapi_sha256 !== "string" ||
		!/^[a-f0-9]{64}$/.test(source.openapi_sha256)
	)
		throw new Error("Invalid pinned contract provenance");
	const provenance: ContractSource = {
		api_commit: source.api_commit,
		openapi_sha256: source.openapi_sha256,
	};
	return {
		schema_version: 2,
		backoffice_commit: commit,
		historical_public_api_commit: provenance.api_commit,
		historical_public_api_contract_sha256: provenance.openapi_sha256,
		operational_api_commit: null,
		backoffice_image: image,
		production_deployment: "disabled",
		operational_api_compatibility:
			"unverified: requires API owner contract and integration evidence",
		verification_mode: "isolated database and operational fixtures",
		portfolio_compatibility:
			"Requires portfolio release evidence from its owner",
	};
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	const [digestPath, outputPath, commit] = process.argv.slice(2);
	if (!digestPath || !outputPath || !commit)
		throw new Error(
			"Usage: node scripts/release-compatibility.ts DIGEST OUTPUT SHA",
		);
	const release = releaseCompatibility(
		commit,
		readFileSync(digestPath, "utf8").trim(),
		JSON.parse(readFileSync("contracts/source.json", "utf8")),
	);
	writeFileSync(outputPath, `${JSON.stringify(release, null, 2)}\n`);
}
