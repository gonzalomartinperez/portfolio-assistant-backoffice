import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { record, text } from "./json.ts";
import { pathToFileURL } from "node:url";

interface ContractSource {
	api_commit: string;
	openapi_sha256: string;
}

export function releaseCompatibility(
	commit: string,
	image: string,
	source: unknown,
	operations: unknown,
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
	const operationalSource = record(operations);
	const operationalCommit = text(operationalSource.api_commit);
	const operationalHash = text(operationalSource.operations_schema_json_sha256);
	if (
		!/^[a-f0-9]{40}$/.test(operationalCommit) ||
		!/^[a-f0-9]{64}$/.test(operationalHash)
	)
		throw new Error("Invalid operational contract provenance");
	return {
		schema_version: 2,
		backoffice_commit: commit,
		historical_public_api_commit: provenance.api_commit,
		historical_public_api_contract_sha256: provenance.openapi_sha256,
		operational_api_commit: operationalCommit,
		operational_api_contract_sha256: operationalHash,
		backoffice_image: image,
		production_deployment: "disabled",
		operational_api_compatibility:
			"pinned schema/example mapping verified; deployed OAuth/API pairing unverified",
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
		JSON.parse(readFileSync("contracts/operations.source.json", "utf8")),
	);
	writeFileSync(outputPath, `${JSON.stringify(release, null, 2)}\n`);
}
