import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import {
	containerLimits,
	dockerSizeBytes,
	measurementOrigin,
	verifyContainerConfiguration,
} from "./container-policy.ts";
import { field, record } from "./json.ts";

const execute = promisify(execFile);
async function docker(...args: string[]) {
	return (
		await execute("docker", args, { timeout: 30_000, maxBuffer: 512_000 })
	).stdout.trim();
}
const [mode, name, originInput] = process.argv.slice(2);
assert.ok(
	name && /^(assistant-browser|portfolio-backoffice-[a-z0-9-]+)$/.test(name),
	"Expected this task's isolated container name.",
);
await mkdir(".artifacts/container", { recursive: true });
if (mode === "shutdown") {
	const start = performance.now();
	await docker("stop", "--time", String(containerLimits.stopSeconds), name);
	const state = record(
		JSON.parse(await docker("inspect", "--format", "{{json .State}}", name)),
	);
	assert.equal(field(state, "OOMKilled"), false);
	assert.ok(
		[0, 143].includes(Number(field(state, "ExitCode"))),
		"Container termination was unexpected or forced.",
	);
	const report = {
		schema_version: 1,
		shutdown_ms: Math.round(performance.now() - start),
		exit_code: field(state, "ExitCode"),
	};
	await writeFile(
		".artifacts/container/shutdown.json",
		`${JSON.stringify(report, null, 2)}\n`,
	);
	console.log(JSON.stringify(report));
} else {
	assert.equal(mode, "measure");
	assert.ok(originInput);
	const origin = measurementOrigin(originInput);
	const image = record(
		JSON.parse(
			await docker(
				"inspect",
				"--format",
				'{"user":{{json .Config.User}},"image":{{json .Image}}}',
				name,
			),
		),
	);
	assert.ok(
		["65532", "65532:65532", "nonroot"].includes(String(field(image, "user"))),
	);
	const imageId = field(image, "image");
	assert.equal(typeof imageId, "string");
	const inspectBytes = Number(
		await docker("image", "inspect", "--format", "{{.Size}}", String(imageId)),
	);
	const diskRow = (
		await docker("image", "ls", "--no-trunc", "--format", "{{.ID}} {{.Size}}")
	)
		.split("\n")
		.find((line) => line.startsWith(`${String(imageId)} `));
	assert.ok(diskRow, "Image is absent from the local Docker store.");
	const bytes = dockerSizeBytes(diskRow.slice(String(imageId).length + 1));

	assert.ok(
		bytes > 0 && bytes <= containerLimits.imageBytes,
		"Runtime image exceeds the reviewed 512 MiB footprint budget.",
	);
	const profile = JSON.parse(
		await docker(
			"inspect",
			"--format",
			'{"readOnly":{{json .HostConfig.ReadonlyRootfs}},"memory":{{json .HostConfig.Memory}},"nanoCpus":{{json .HostConfig.NanoCpus}},"pids":{{json .HostConfig.PidsLimit}},"capDrop":{{json .HostConfig.CapDrop}},"securityOpt":{{json .HostConfig.SecurityOpt}},"logDriver":{{json .HostConfig.LogConfig.Type}},"logOptions":{{json .HostConfig.LogConfig.Config}}}',
			name,
		),
	);
	verifyContainerConfiguration(profile);
	for (let attempt = 0; attempt < 30; attempt++) {
		try {
			const ready = await fetch(`${origin}/api/ready`, {
				signal: AbortSignal.timeout(6000),
			});
			if (ready.ok) break;
		} catch {
			/* Startup can precede the listening socket. */
		}
		assert.ok(attempt < 29, "Container readiness did not recover.");
		await delay(500);
	}
	const denied = await fetch(`${origin}/api/operations`, {
		signal: AbortSignal.timeout(6000),
	});
	assert.equal(denied.status, 401);
	const writable = record(
		JSON.parse(
			await docker(
				"exec",
				name,
				"node",
				"-e",
				'const fs=require("node:fs");for(const p of ["/tmp","/app/.next/cache"])fs.writeFileSync(p+"/profile-check", "fixture");let readOnly=false;try{fs.writeFileSync("/app/public/profile-check","fixture")}catch(e){readOnly=e.code==="EROFS"}for(const p of ["/tmp","/app/.next/cache"])fs.unlinkSync(p+"/profile-check");let compiler=false;try{require.resolve("typescript");compiler=true}catch{};console.log(JSON.stringify({readOnly,compiler}))',
			),
		),
	);
	assert.equal(field(writable, "readOnly"), true);
	assert.equal(field(writable, "compiler"), false);
	const idle = record(
		JSON.parse(
			await docker("stats", "--no-stream", "--format", "{{json .}}", name),
		),
	);
	const durations: number[] = [];
	let next = 0;
	const start = performance.now();
	await Promise.all(
		Array.from({ length: 8 }, async () => {
			while (next < 64) {
				const index = next++;
				const requestStart = performance.now();
				const response = await fetch(
					`${origin}${index % 2 ? "/api/health" : "/sign-in"}`,
					{ signal: AbortSignal.timeout(10_000) },
				);
				assert.equal(response.status, 200);
				await response.arrayBuffer();
				durations.push(performance.now() - requestStart);
			}
		}),
	);
	const elapsed = performance.now() - start;
	const after = record(
		JSON.parse(
			await docker("stats", "--no-stream", "--format", "{{json .}}", name),
		),
	);
	durations.sort((a, b) => a - b);
	const report = {
		schema_version: 1,
		image_id: imageId,
		image_disk_bytes: bytes,
		image_inspect_bytes: inspectBytes,
		profile,
		workload:
			"64 anonymous sign-in/health requests; concurrency 8; synthetic IAM",
		requests: durations.length,
		elapsed_ms: Math.round(elapsed),
		p50_ms: Math.round(durations[Math.floor(durations.length * 0.5)] ?? 0),
		p95_ms: Math.round(durations[Math.floor(durations.length * 0.95)] ?? 0),
		idle_memory: field(idle, "MemUsage"),
		after_workload_memory: field(after, "MemUsage"),
		idle_pids: field(idle, "PIDs"),
		after_workload_pids: field(after, "PIDs"),
	};
	await writeFile(
		".artifacts/container/measurement.json",
		`${JSON.stringify(report, null, 2)}\n`,
	);
	console.log(JSON.stringify(report));
}
