import {
	canSubmit,
	hasRecoveredAnswer,
	initialState,
	isRunning,
	transition,
	type AssistantState,
	type Failure,
	type Locale,
	type Message,
} from "../domain/models.ts";
import {
	AssistantError,
	type AssistantTransport,
	type Runtime,
} from "./ports.ts";

export function createAssistant(api: AssistantTransport, runtime: Runtime) {
	let state: AssistantState = { ...initialState };
	const listeners = new Set<() => void>();
	let lifetime = new AbortController();
	let selection = 0;
	let generation: {
		controller: AbortController;
		conversationId: string | null;
		runId: string | null;
		stopping: boolean;
	} | null = null;
	let loading: AbortController | null = null;
	function publish(patch: Partial<AssistantState>) {
		if (lifetime.signal.aborted) return;
		state = { ...state, ...patch };
		for (const listener of listeners) listener();
	}
	function reason(error: unknown): Failure {
		return error instanceof AssistantError ? error.reason : "unavailable";
	}
	function fail(error: unknown) {
		const failure = reason(error);
		publish({
			notice: failure,
			lifecycle: transition(state.lifecycle, {
				kind: "fail",
				reason: failure,
				conversationId: state.active,
			}),
		});
	}
	async function selectConversation(id: string | null) {
		const version = ++selection;
		loading?.abort();
		loading = new AbortController();
		const signal = AbortSignal.any([loading.signal, lifetime.signal]);
		publish({ active: id, history: [], historyLoading: !!id, notice: null });
		if (!id) return;
		try {
			const history = await api.messages(id, signal);
			if (version === selection && !signal.aborted) publish({ history });
		} catch (error) {
			if (!signal.aborted && version === selection) fail(error);
		} finally {
			if (version === selection && !signal.aborted)
				publish({ historyLoading: false });
		}
	}
	async function initialize() {
		if (isRunning(state.lifecycle)) return;
		publish({ lifecycle: { kind: "initializing" }, notice: null });
		const signal = lifetime.signal;
		try {
			const session = await api.session(signal);
			const items = await api.conversations(signal);
			if (signal.aborted) return;
			publish({
				items,
				retentionDays: session.retention_days,
				lifecycle: { kind: "ready" },
			});
			await selectConversation(
				items.some((item) => item.id === state.active)
					? state.active
					: (items[0]?.id ?? null),
			);
		} catch (error) {
			if (!signal.aborted)
				publish({
					lifecycle: {
						kind: reason(error) === "expired" ? "expired" : "unavailable",
					},
					notice: reason(error),
				});
		}
	}
	async function recover() {
		if (
			generation ||
			state.mutation ||
			state.historyLoading ||
			state.lifecycle.kind === "initializing"
		)
			return;
		await initialize();
		// Only discard a local partial when its saved assistant message has been recovered.
		if (
			state.partial &&
			state.active === state.partial.conversationId &&
			hasRecoveredAnswer(state.history, state.partial)
		)
			publish({ partial: null });
	}
	async function mutate(operation: (signal: AbortSignal) => Promise<void>) {
		if (state.mutation || generation) return;
		publish({ mutation: true, notice: null });
		try {
			await operation(lifetime.signal);
		} catch (error) {
			fail(error);
		} finally {
			publish({ mutation: false });
		}
	}
	async function newChat() {
		await mutate(async (signal) => {
			const item = await api.createConversation(signal);
			if (signal.aborted) return;
			publish({
				items: [item, ...state.items],
				partial: null,
				lifecycle: { kind: "ready" },
			});
			await selectConversation(item.id);
		});
	}
	async function remove(id: string) {
		await mutate(async (signal) => {
			await api.deleteConversation(id, signal);
			if (signal.aborted) return;
			const items = state.items.filter((item) => item.id !== id);
			publish({
				items,
				partial: state.partial?.conversationId === id ? null : state.partial,
			});
			if (state.active === id) await selectConversation(items[0]?.id ?? null);
		});
	}
	async function rename(id: string, title: string) {
		if (!title.trim()) return;
		await mutate(async (signal) => {
			await api.renameConversation(id, title.trim(), signal);
			publish({
				items: state.items.map((item) =>
					item.id === id ? { ...item, title: title.trim() } : item,
				),
			});
		});
	}
	async function rate(id: string, rating: "up" | "down") {
		if (generation || state.mutation) return;
		const conversationId = state.active;
		try {
			await api.feedback(id, rating, lifetime.signal);
			publish({ ratings: { ...state.ratings, [id]: rating } });
		} catch (error) {
			if (state.active !== conversationId) return;
			const failure = reason(error);
			publish({
				notice: failure,
				...(failure === "expired" && !generation
					? { lifecycle: { kind: "expired" as const } }
					: {}),
			});
		}
	}
	async function submit(question: string, locale: Locale) {
		if (!question.trim() || !canSubmit(state) || generation) return false;
		const current = {
			controller: new AbortController(),
			conversationId: state.active,
			runId: null as string | null,
			stopping: false,
			previousMessageIds: state.history.map((message) => message.id),
		};
		generation = current;
		const signal = AbortSignal.any([
			current.controller.signal,
			lifetime.signal,
		]);
		publish({
			lifecycle: transition(state.lifecycle, {
				kind: "submit",
				conversationId: state.active,
			}),
			notice: null,
			partial: null,
		});
		let answer: Message | null = null;
		let terminal: "completed" | "cancelled" | "failed" | null = null;
		try {
			if (!current.conversationId) {
				const item = await api.createConversation(signal);
				if (signal.aborted) return true;
				current.conversationId = item.id;
				++selection;
				loading?.abort();
				publish({
					items: [item, ...state.items],
					active: item.id,
					history: [],
					historyLoading: false,
				});
			}
			const id = current.conversationId;
			const user: Message = {
				id: runtime.id(),
				role: "user",
				content: question.trim(),
				citations: [],
				created_at: runtime.now(),
			};
			publish({
				history: state.active === id ? [...state.history, user] : state.history,
				partial: {
					conversationId: id,
					content: "",
					previousMessageIds: current.previousMessageIds,
				},
			});
			await api.send(
				id,
				question.trim(),
				locale,
				signal,
				(event) => {
					if (generation !== current || signal.aborted) return;
					if (event.kind === "started") {
						current.runId = event.runId;
						publish({
							lifecycle: transition(state.lifecycle, {
								kind: "stream",
								conversationId: id,
								runId: event.runId,
							}),
						});
					}
					if (event.kind === "delta")
						publish({
							partial: {
								conversationId: id,
								content: (state.partial?.content ?? "") + event.text,
								previousMessageIds: current.previousMessageIds,
							},
						});
					if (event.kind === "answer") {
						answer = event.message;
						publish({
							partial: {
								conversationId: id,
								content: event.message.content,
								previousMessageIds: current.previousMessageIds,
								messageId: event.message.id,
							},
						});
					}
					if (
						event.kind === "completed" ||
						event.kind === "failed" ||
						event.kind === "cancelled"
					)
						terminal = event.kind;
				},
				runtime.id(),
			);
			if (signal.aborted) return true;
			if (!terminal) throw new AssistantError("interrupted");
			if (terminal === "failed") throw new AssistantError("interrupted");
			if (answer && state.active === id)
				publish({ history: [...state.history, answer], partial: null });
			publish({
				lifecycle: transition(
					state.lifecycle,
					terminal === "completed"
						? { kind: "complete", conversationId: id }
						: { kind: "cancel", conversationId: id },
				),
			});
			// Persisted history is authoritative; selection ownership is rechecked after the await.
			const version = selection;
			try {
				const history = await api.messages(id, signal);
				if (!signal.aborted && version === selection && state.active === id)
					publish({
						history: history.some(
							(message) => !current.previousMessageIds.includes(message.id),
						)
							? history
							: state.history,
						partial:
							state.partial && hasRecoveredAnswer(history, state.partial)
								? null
								: state.partial,
					});
			} catch (error) {
				if (!signal.aborted) publish({ notice: reason(error) });
			}
		} catch (error) {
			if (!signal.aborted) {
				const failure =
					error instanceof AssistantError ? error.reason : "interrupted";
				publish({
					notice: failure,
					lifecycle: transition(state.lifecycle, {
						kind: "fail",
						reason: failure,
						conversationId: current.conversationId,
					}),
				});
			}
		} finally {
			if (generation === current) {
				if (current.stopping)
					publish({
						lifecycle: transition(state.lifecycle, {
							kind: "cancel",
							conversationId: current.conversationId,
						}),
					});
				if (state.partial?.content === "") publish({ partial: null });
				generation = null;
			}
		}
		return true;
	}
	async function stop() {
		const current = generation;
		if (!current || current.stopping) return;
		current.stopping = true;
		current.controller.abort();
		if (current.runId) {
			try {
				await api.cancelRun(
					current.runId,
					AbortSignal.any([lifetime.signal, AbortSignal.timeout(5000)]),
				);
			} catch {
				if (state.active === current.conversationId)
					publish({ notice: "interrupted" });
			}
		}
	}
	function dispose() {
		lifetime.abort();
		loading?.abort();
		generation?.controller.abort();
		listeners.clear();
	}
	function start() {
		if (lifetime.signal.aborted) lifetime = new AbortController();
		void initialize();
	}
	return {
		getSnapshot: () => state,
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		start,
		dispose,
		initialize,
		recover,
		selectConversation,
		newChat,
		remove,
		rename,
		rate,
		submit,
		stop,
	};
}
export type Assistant = ReturnType<typeof createAssistant>;
