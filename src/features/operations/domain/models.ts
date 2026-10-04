export type RunOutcome = "completed" | "cancelled" | "failed";
export type StageName =
	| "language"
	| "vector_retrieval"
	| "graph_retrieval"
	| "generation"
	| "finalization";
export type ExecutionTrace = {
	id: string;
	startedAt: string;
	outcome: RunOutcome;
	durationMs: number;
	stages: ReadonlyArray<{ name: StageName; durationMs: number }>;
};
export type OperationalSnapshot = {
	observedAt: string;
	apiCommit: string;
	availability: "ready" | "degraded" | "unavailable";
	knowledge: {
		state: "fresh" | "updating" | "stale";
		sourceCommit: string;
		corpusVersion: string;
		indexedAt: string;
	};
	executions: {
		total: number;
		completed: number;
		cancelled: number;
		failed: number;
		firstTokenP50Ms: number | null;
		firstTokenP95Ms: number | null;
	};
	usage: {
		inputTokens: number;
		outputTokens: number;
		settledUsd: number;
		reservedUsd: number;
		budgetUsd: number;
		pricingRevision: string;
	};
	traces: readonly ExecutionTrace[];
};
export type OperationalRead =
	| { kind: "available"; snapshot: OperationalSnapshot; checkedAt: string }
	| { kind: "unconfigured"; checkedAt: string }
	| {
			kind: "unavailable";
			reason: "transport" | "authorization" | "contract";
			checkedAt: string;
	  };
