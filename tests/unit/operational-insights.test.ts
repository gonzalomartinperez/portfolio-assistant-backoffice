import assert from "node:assert/strict";
import test from "node:test";
import {
	summarizeOperations,
	selectTraces,
} from "../../src/features/operations/domain/insights.ts";
import { parseOperationalSnapshot } from "../../src/features/operations/adapters/validate.ts";
import { validateGrafanaDestination } from "../../src/features/operations/adapters/grafana-link.ts";
import { operationalPayload } from "../fixtures/operations.ts";

const snapshot = parseOperationalSnapshot(operationalPayload);

test("summary keeps reservations, settlement and unclassified outcomes distinct", () => {
	const result = summarizeOperations({
		...snapshot,
		executions: { ...snapshot.executions, total: 26 },
	});
	assert.equal(result.unclassified, 2);
	assert.equal(result.completionShare, 20 / 26);
	assert.equal(result.accountedUsd, 0.03);
	assert.equal(result.remainingUsd, 9.97);
	assert.equal(snapshot.executions.total, 24);
});
test("zero observations and zero budget do not invent percentages", () => {
	const result = summarizeOperations({
		...snapshot,
		executions: {
			...snapshot.executions,
			total: 0,
			completed: 0,
			cancelled: 0,
			failed: 0,
		},
		usage: { ...snapshot.usage, budgetUsd: 0 },
	});
	assert.equal(result.completionShare, null);
	assert.equal(result.budgetShare, null);
	assert.equal(result.remainingUsd, 0);
});
test("overspending remains visible instead of being clamped in the model", () => {
	const result = summarizeOperations({
		...snapshot,
		usage: { ...snapshot.usage, budgetUsd: 10, settledUsd: 11, reservedUsd: 1 },
	});
	assert.equal(result.budgetShare, 1.2);
	assert.equal(result.accountedUsd, 12);
	assert.equal(result.remainingUsd, 0);
});
test("trace selection combines outcome and bounded case-insensitive ID queries", () => {
	assert.equal(selectTraces(snapshot.traces, "all", " CCCC ").length, 1);
	assert.equal(selectTraces(snapshot.traces, "failed", "cccc").length, 0);
	assert.equal(selectTraces(snapshot.traces, "completed", "missing").length, 0);
	assert.deepEqual(selectTraces([], "all", ""), []);
	assert.equal(snapshot.traces.length, 1);
});
test("Grafana links accept configured dashboard destinations without URL credentials", () => {
	assert.equal(
		validateGrafanaDestination(
			"https://monitoring.example.test/d/assistant/overview",
		),
		"https://monitoring.example.test/d/assistant/overview",
	);
	assert.equal(
		validateGrafanaDestination("http://localhost:3011/d/assistant/overview"),
		"http://localhost:3011/d/assistant/overview",
	);
	for (const candidate of [
		undefined,
		"",
		"javascript:alert(1)",
		"http://monitoring.example.test/d/a/overview",
		"https://user:secret@monitoring.example.test/d/a/overview",
		"https://monitoring.example.test/d/a/overview?token=private",
		"https://monitoring.example.test/d/a/overview#private",
		"https://monitoring.example.test/login",
		"https://monitoring.example.test/d/../login",
		"https://monitoring.example.test/d/a/overview\n",
		"x".repeat(2049),
	])
		assert.equal(validateGrafanaDestination(candidate), null);
});
