export type Locale = "en" | "es";
export type Citation = {
	id: string;
	label: string;
	url: string;
	source_type: "page" | "code";
	path?: string | null;
	start_line?: number | null;
	end_line?: number | null;
};
export type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	citations: Citation[];
	created_at: string;
};
export type Conversation = {
	id: string;
	title: string;
	created_at: string;
	updated_at: string;
};
export type Failure = "unavailable" | "expired" | "rejected" | "interrupted";
export type Lifecycle =
	| { kind: "initializing" }
	| { kind: "ready" }
	| { kind: "submitting"; conversationId: string | null }
	| { kind: "streaming"; conversationId: string; runId: string }
	| { kind: "completed"; conversationId: string }
	| { kind: "cancelled"; conversationId: string | null }
	| { kind: "failure"; reason: Failure; conversationId: string | null }
	| { kind: "unavailable" | "expired" };
export type Progress =
	| { kind: "started"; runId: string }
	| { kind: "delta"; text: string }
	| { kind: "answer"; message: Message }
	| { kind: "completed" | "cancelled" | "failed" };
export type PartialAnswer = {
	conversationId: string;
	content: string;
	previousMessageIds: readonly string[];
	messageId?: string;
};
export function hasRecoveredAnswer(
	history: Message[],
	partial: PartialAnswer,
): boolean {
	const last = history.at(-1);
	return (
		last?.role === "assistant" &&
		(partial.messageId
			? last.id === partial.messageId
			: !partial.previousMessageIds.includes(last.id))
	);
}
export type AssistantState = {
	lifecycle: Lifecycle;
	items: Conversation[];
	active: string | null;
	history: Message[];
	partial: PartialAnswer | null;
	historyLoading: boolean;
	mutation: boolean;
	notice: Failure | null;
	retentionDays: number | null;
	ratings: Record<string, "up" | "down">;
};
export const initialState: AssistantState = {
	lifecycle: { kind: "initializing" },
	items: [],
	active: null,
	history: [],
	partial: null,
	historyLoading: false,
	mutation: false,
	notice: null,
	retentionDays: null,
	ratings: {},
};
export function isRunning(state: Lifecycle): boolean {
	return state.kind === "submitting" || state.kind === "streaming";
}
export function canSubmit(state: AssistantState): boolean {
	return (
		!isRunning(state.lifecycle) &&
		!state.historyLoading &&
		!state.mutation &&
		!["initializing", "unavailable", "expired"].includes(
			state.lifecycle.kind,
		) &&
		!state.partial
	);
}
export type LifecycleEvent =
	| { kind: "submit"; conversationId: string | null }
	| { kind: "stream"; conversationId: string; runId: string }
	| { kind: "complete"; conversationId: string }
	| { kind: "cancel"; conversationId: string | null }
	| { kind: "fail"; reason: Failure; conversationId: string | null }
	| { kind: "ready" };
export function transition(state: Lifecycle, event: LifecycleEvent): Lifecycle {
	switch (event.kind) {
		case "submit":
			return isRunning(state)
				? state
				: { kind: "submitting", conversationId: event.conversationId };
		case "stream":
			return isRunning(state)
				? {
						kind: "streaming",
						conversationId: event.conversationId,
						runId: event.runId,
					}
				: state;
		case "complete":
			return isRunning(state)
				? { kind: "completed", conversationId: event.conversationId }
				: state;
		case "cancel":
			return isRunning(state)
				? { kind: "cancelled", conversationId: event.conversationId }
				: state;
		case "fail":
			return event.reason === "expired"
				? { kind: "expired" }
				: {
						kind: "failure",
						reason: event.reason,
						conversationId: event.conversationId,
					};
		case "ready":
			return isRunning(state) ? state : { kind: "ready" };
	}
}
