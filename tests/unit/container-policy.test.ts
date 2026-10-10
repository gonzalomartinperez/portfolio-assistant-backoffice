import assert from "node:assert/strict";
import test from "node:test";
import {
	containerLimits,
	dockerSizeBytes,
	measurementOrigin,
	verifyContainerConfiguration,
} from "../../scripts/container-policy.ts";

const profile = {
	readOnly: true,
	memory: containerLimits.memoryBytes,
	nanoCpus: containerLimits.nanoCpus,
	pids: containerLimits.pids,
	capDrop: ["ALL"],
	securityOpt: ["no-new-privileges"],
	logDriver: "local",
	logOptions: { "max-size": "10m", "max-file": "3" },
};

test("container acceptance rejects unbounded memory, PIDs, logs and weakened isolation", () => {
	verifyContainerConfiguration(profile);
	for (const changed of [
		{ readOnly: false },
		{ memory: 0 },
		{ nanoCpus: 0 },
		{ pids: -1 },
		{ capDrop: [] },
		{ securityOpt: [] },
		{ logDriver: "json-file" },
		{ logOptions: {} },
	]) {
		assert.throws(() =>
			verifyContainerConfiguration({ ...profile, ...changed }),
		);
	}
});

test("measurements cannot contact a public origin or a credentialed URL", () => {
	assert.equal(
		measurementOrigin("http://127.0.0.1:3118"),
		"http://127.0.0.1:3118",
	);
	for (const origin of [
		"https://assistant.gonzalomartinperez.com",
		"http://localhost",
		"http://user:password@localhost:3118",
		"http://localhost:3118/private",
		"http://localhost:3118/?key=fixture",
	]) {
		assert.throws(() => measurementOrigin(origin));
	}
});

test("image disk usage is distinguished from content size and parsed without unit guessing", () => {
	assert.equal(dockerSizeBytes("955MB"), 955_000_000);
	assert.equal(dockerSizeBytes("512MiB"), 536_870_912);
	assert.equal(dockerSizeBytes("1.5GB"), 1_500_000_000);
	for (const value of ["", "unknown", "-1MB", "12", "infiniteGB"])
		assert.throws(() => dockerSizeBytes(value));
});
