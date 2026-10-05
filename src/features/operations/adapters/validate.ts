import type {
	ExecutionTrace,
	OperationalSnapshot,
	RunOutcome,
	StageName,
} from "../domain/models.ts";
export class OperationalPayloadError extends Error {
	constructor() {
		super("Invalid operational payload");
	}
}
function object(
	value: unknown,
	expected: readonly string[],
): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new OperationalPayloadError();
	const entries = Object.entries(value);
	if (
		entries.length !== expected.length ||
		entries.some(([key]) => !expected.includes(key))
	)
		throw new OperationalPayloadError();
	return Object.fromEntries(entries);
}
function number(value: unknown, integer = false): number {
	if (
		typeof value !== "number" ||
		!Number.isFinite(value) ||
		value < 0 ||
		value > 1e12 ||
		(integer && !Number.isSafeInteger(value))
	)
		throw new OperationalPayloadError();
	return value;
}
function text(value: unknown, pattern: RegExp, maximum = 128): string {
	if (
		typeof value !== "string" ||
		value.length > maximum ||
		!pattern.test(value)
	)
		throw new OperationalPayloadError();
	return value;
}
function date(value: unknown): string {
	const result = text(
		value,
		/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/,
		40,
	);
	if (!Number.isFinite(Date.parse(result))) throw new OperationalPayloadError();
	return result;
}
function nullableNumber(value: unknown): number | null {
	return value === null ? null : number(value);
}
function outcome(value: unknown): RunOutcome {
	if (value === "completed" || value === "cancelled" || value === "failed")
		return value;
	throw new OperationalPayloadError();
}
function stage(value: unknown): StageName {
	if (
		value === "language" ||
		value === "vector_retrieval" ||
		value === "graph_retrieval" ||
		value === "generation" ||
		value === "finalization"
	)
		return value;
	throw new OperationalPayloadError();
}
function trace(value: unknown): ExecutionTrace {
	const item = object(value, [
		"id",
		"started_at",
		"outcome",
		"duration_ms",
		"stages",
	]);
	if (!Array.isArray(item.stages) || item.stages.length > 32)
		throw new OperationalPayloadError();
	return {
		id: text(item.id, /^[a-f0-9]{32}$/),
		startedAt: date(item.started_at),
		outcome: outcome(item.outcome),
		durationMs: number(item.duration_ms),
		stages: item.stages.map((value: unknown, position: number) => {
			const item = object(value, ["name", "duration_ms"]);
			return {
				id: String(position),
				name: stage(item.name),
				durationMs: number(item.duration_ms),
			};
		}),
	};
}
export function parseOperationalSnapshot(value: unknown): OperationalSnapshot {
	const item = object(value, [
		"schema_version",
		"observed_at",
		"api_commit",
		"availability",
		"knowledge",
		"executions",
		"usage",
		"traces",
	]);
	if (
		item.schema_version !== 1 ||
		!["ready", "degraded", "unavailable"].includes(String(item.availability))
	)
		throw new OperationalPayloadError();
	const availability = item.availability;
	if (
		availability !== "ready" &&
		availability !== "degraded" &&
		availability !== "unavailable"
	)
		throw new OperationalPayloadError();
	const knowledge = object(item.knowledge, [
		"state",
		"source_commit",
		"corpus_version",
		"indexed_at",
	]);
	const state = knowledge.state;
	if (state !== "fresh" && state !== "updating" && state !== "stale")
		throw new OperationalPayloadError();
	const executions = object(item.executions, [
		"total",
		"completed",
		"cancelled",
		"failed",
		"first_token_p50_ms",
		"first_token_p95_ms",
	]);
	const usage = object(item.usage, [
		"input_tokens",
		"output_tokens",
		"settled_usd",
		"reserved_usd",
		"budget_usd",
		"pricing_revision",
	]);
	if (!Array.isArray(item.traces) || item.traces.length > 100)
		throw new OperationalPayloadError();
	const total = number(executions.total, true);
	const completed = number(executions.completed, true);
	const cancelled = number(executions.cancelled, true);
	const failed = number(executions.failed, true);
	if (completed + cancelled + failed > total)
		throw new OperationalPayloadError();
	return {
		observedAt: date(item.observed_at),
		apiCommit: text(item.api_commit, /^[a-f0-9]{40}$/),
		availability,
		knowledge: {
			state,
			sourceCommit: text(knowledge.source_commit, /^[a-f0-9]{40}$/),
			corpusVersion: text(knowledge.corpus_version, /^[a-zA-Z0-9._-]{1,128}$/),
			indexedAt: date(knowledge.indexed_at),
		},
		executions: {
			total,
			completed,
			cancelled,
			failed,
			firstTokenP50Ms: nullableNumber(executions.first_token_p50_ms),
			firstTokenP95Ms: nullableNumber(executions.first_token_p95_ms),
		},
		usage: {
			inputTokens: number(usage.input_tokens, true),
			outputTokens: number(usage.output_tokens, true),
			settledUsd: number(usage.settled_usd),
			reservedUsd: number(usage.reserved_usd),
			budgetUsd: number(usage.budget_usd),
			pricingRevision: text(usage.pricing_revision, /^[a-zA-Z0-9._-]{1,128}$/),
		},
		traces: item.traces.map((value: unknown) => trace(value)),
	};
}
