import { field, list, record } from "./json.ts";

export const containerLimits = {
	imageBytes: 512 * 1024 * 1024,
	memoryBytes: 512 * 1024 * 1024,
	nanoCpus: 750_000_000,
	pids: 128,
	stopSeconds: 20,
} as const;

export function verifyContainerConfiguration(value: unknown): void {
	const config = record(value);
	if (
		field(config, "readOnly") !== true ||
		field(config, "memory") !== containerLimits.memoryBytes ||
		field(config, "nanoCpus") !== containerLimits.nanoCpus ||
		field(config, "pids") !== containerLimits.pids ||
		!list(field(config, "capDrop")).includes("ALL") ||
		!list(field(config, "securityOpt")).includes("no-new-privileges") ||
		field(config, "logDriver") !== "local" ||
		field(record(field(config, "logOptions")), "max-size") !== "10m" ||
		field(record(field(config, "logOptions")), "max-file") !== "3"
	)
		throw new Error(
			"Container does not match the tested hardening/resource profile.",
		);
}

export function measurementOrigin(value: string): string {
	const url = new URL(value);
	if (
		url.protocol !== "http:" ||
		!["127.0.0.1", "localhost"].includes(url.hostname) ||
		!url.port ||
		Number(url.port) < 1024 ||
		url.username ||
		url.password ||
		url.pathname !== "/" ||
		url.search ||
		url.hash
	)
		throw new Error(
			"Container measurements require an isolated loopback origin.",
		);
	return url.origin;
}

export function dockerSizeBytes(value: string): number {
	const match = /^(\d+(?:\.\d+)?)\s*(B|kB|MB|GB|KiB|MiB|GiB)$/.exec(value);
	if (!match) throw new Error("Unexpected Docker image size.");
	const factors: Record<string, number> = {
		B: 1,
		kB: 1000,
		MB: 1_000_000,
		GB: 1_000_000_000,
		KiB: 1024,
		MiB: 1024 ** 2,
		GiB: 1024 ** 3,
	};
	const factor = factors[match[2] ?? ""];
	if (factor === undefined)
		throw new Error("Unexpected Docker image size unit.");
	return Math.round(Number(match[1]) * factor);
}
