import type {
	ExecutionTrace,
	OperationalSnapshot,
	RunOutcome,
} from "./models.ts";

export function summarizeOperations(snapshot: OperationalSnapshot) {
	const { executions, usage } = snapshot;
	const accountedUsd = usage.settledUsd + usage.reservedUsd;
	return {
		completionShare:
			executions.total > 0 ? executions.completed / executions.total : null,
		unclassified: Math.max(
			0,
			executions.total -
				executions.completed -
				executions.cancelled -
				executions.failed,
		),
		accountedUsd,
		budgetShare: usage.budgetUsd > 0 ? accountedUsd / usage.budgetUsd : null,
		remainingUsd: Math.max(0, usage.budgetUsd - accountedUsd),
	};
}

export function selectTraces(
	traces: readonly ExecutionTrace[],
	outcome: RunOutcome | "all",
	query: string,
) {
	const search = query.trim().toLowerCase().slice(0, 32);
	return traces.filter(
		(trace) =>
			(outcome === "all" || trace.outcome === outcome) &&
			trace.id.toLowerCase().includes(search),
	);
}
