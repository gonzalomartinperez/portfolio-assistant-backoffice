export const operationalPayload = {
	schema_version: 1,
	observed_at: "2026-10-04T12:00:00.000Z",
	api_commit: "a".repeat(40),
	availability: "ready",
	knowledge: {
		state: "fresh",
		source_commit: "b".repeat(40),
		corpus_version: "fixture-1",
		indexed_at: "2026-10-04T11:59:00.000Z",
	},
	executions: {
		total: 24,
		completed: 20,
		cancelled: 3,
		failed: 1,
		first_token_p50_ms: 320,
		first_token_p95_ms: 840,
	},
	usage: {
		input_tokens: 2400,
		output_tokens: 1200,
		settled_usd: 0.02,
		reserved_usd: 0.01,
		budget_usd: 10,
		pricing_revision: "fixture-prices",
	},
	traces: [
		{
			id: "c".repeat(32),
			started_at: "2026-10-04T11:58:00.000Z",
			outcome: "completed",
			duration_ms: 950,
			stages: [
				{ name: "vector_retrieval", duration_ms: 45 },
				{ name: "generation", duration_ms: 890 },
			],
		},
	],
};
