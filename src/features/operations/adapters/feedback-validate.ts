import type { components } from "../../../../contracts/feedback.types";
import type { FeedbackSnapshot } from "../domain/feedback.ts";
export function parseFeedback(value: unknown): FeedbackSnapshot {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Invalid feedback");
	const row: Record<string, unknown> = Object.fromEntries(
		Object.entries(value),
	);
	const fields = [
		"schema_version",
		"project",
		"basis",
		"window_days",
		"observed_at",
		"up",
		"down",
	];
	if (
		Object.keys(row).length !== fields.length ||
		fields.some((key) => !Object.hasOwn(row, key)) ||
		row.schema_version !== 1 ||
		row.project !== "portfolio" ||
		row.basis !== "retained_answer_creation" ||
		row.window_days !== 7
	)
		throw new Error("Invalid feedback fields");
	const { observed_at: observedAt, up, down } = row;
	if (
		typeof observedAt !== "string" ||
		!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(
			observedAt,
		) ||
		!Number.isFinite(Date.parse(observedAt)) ||
		new Date(observedAt).toISOString().slice(0, 19) !==
			observedAt.slice(0, 19) ||
		typeof up !== "number" ||
		!Number.isSafeInteger(up) ||
		up < 0 ||
		up > 1e12 ||
		typeof down !== "number" ||
		!Number.isSafeInteger(down) ||
		down < 0 ||
		down > 1e12
	)
		throw new Error("Invalid feedback values");
	const wire: components["schemas"]["FeedbackView"] = {
		schema_version: 1,
		project: "portfolio",
		basis: "retained_answer_creation",
		window_days: 7,
		observed_at: observedAt,
		up,
		down,
	};
	return { observedAt: wire.observed_at, up: wire.up, down: wire.down };
}
