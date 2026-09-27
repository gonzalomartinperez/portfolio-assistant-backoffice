import { readSse } from "./sse.ts";
import {
	parseConversation,
	parseMessage,
	parsePage,
	parseSession,
} from "./validate.ts";
import {
	AssistantError,
	type AssistantTransport,
} from "../application/ports.ts";
import type { components } from "../../../../contracts/types";

export function createHttpTransport(
	base: string,
	fetcher: typeof fetch = fetch,
): AssistantTransport {
	let csrf: string | null = null;
	async function request(
		path: string,
		signal: AbortSignal,
		init: RequestInit = {},
	) {
		const response = await fetcher(`${base}${path}`, {
			...init,
			signal,
			credentials: "include",
			cache: "no-store",
			headers: {
				...(init.body ? { "Content-Type": "application/json" } : {}),
				...(csrf && init.method && init.method !== "GET"
					? { "X-CSRF-Token": csrf }
					: {}),
				...init.headers,
			},
		});
		if (!response.ok) {
			await response.body?.cancel().catch(() => {});
			if (response.status === 401) csrf = null;
			throw new AssistantError(
				response.status === 401
					? "expired"
					: response.status >= 400 && response.status < 500
						? "rejected"
						: "unavailable",
			);
		}
		return response;
	}
	async function pages<T>(
		path: string,
		signal: AbortSignal,
		parse: (value: unknown) => T,
	): Promise<T[]> {
		const items: T[] = [];
		let cursor: string | null = null;
		const seen = new Set<string>();
		do {
			const page = parsePage(
				await (
					await request(
						path + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""),
						signal,
					)
				).json(),
			);
			items.push(...page.items.map(parse));
			cursor = page.cursor;
			if (cursor && (seen.has(cursor) || seen.size >= 100))
				throw new AssistantError("unavailable");
			if (cursor) seen.add(cursor);
		} while (cursor);
		return items;
	}
	const path = (id: string) =>
		`/api/v1/conversations/${encodeURIComponent(id)}`;
	return {
		async session(signal) {
			let response = await fetcher(`${base}/api/v1/session`, {
				credentials: "include",
				cache: "no-store",
				signal,
			});
			if (response.status === 401) {
				await response.body?.cancel().catch(() => {});
				csrf = null;
				response = await request("/api/v1/session", signal, {
					method: "POST",
					headers: { "X-Session-Bootstrap": "1" },
					body: "{}",
				});
			}
			if (!response.ok) throw new AssistantError("unavailable");
			const data = parseSession(await response.json());
			csrf = data.csrf_token;
			return { retention_days: data.retention_days };
		},
		conversations: (signal) =>
			pages("/api/v1/conversations", signal, parseConversation),
		async createConversation(signal) {
			return parseConversation(
				await (
					await request("/api/v1/conversations", signal, {
						method: "POST",
						body: "{}",
					})
				).json(),
			);
		},
		async messages(id, signal) {
			return (
				await pages(`${path(id)}/messages`, signal, parseMessage)
			).reverse();
		},
		async renameConversation(id, title, signal) {
			await request(path(id), signal, {
				method: "PATCH",
				body: JSON.stringify({
					title,
				} satisfies components["schemas"]["ConversationUpdate"]),
			});
		},
		async deleteConversation(id, signal) {
			await request(path(id), signal, { method: "DELETE" });
		},
		async feedback(id, rating, signal) {
			await request(
				`/api/v1/messages/${encodeURIComponent(id)}/feedback`,
				signal,
				{
					method: "POST",
					body: JSON.stringify({
						rating,
					} satisfies components["schemas"]["FeedbackCreate"]),
				},
			);
		},
		async cancelRun(id, signal) {
			await request(`/api/v1/runs/${encodeURIComponent(id)}/cancel`, signal, {
				method: "POST",
				body: "{}",
			});
		},
		async send(id, content, locale, signal, onProgress, key) {
			const response = await request(`${path(id)}/messages/stream`, signal, {
				method: "POST",
				headers: { "Idempotency-Key": key },
				body: JSON.stringify({
					content,
					locale,
				} satisfies components["schemas"]["SendMessage"]),
			});
			const runId = response.headers.get("X-Run-ID");
			if (runId) onProgress({ kind: "started", runId });
			if (
				!response.body ||
				!response.headers.get("content-type")?.includes("text/event-stream")
			) {
				await response.body?.cancel().catch(() => {});
				throw new AssistantError("interrupted");
			}
			let answered = false;
			const terminal = await readSse(
				response.body,
				(event) => {
					if (event.conversation_id !== id || (runId && event.run_id !== runId))
						throw new AssistantError("interrupted");
					switch (event.type) {
						case "run.started":
							onProgress({ kind: "started", runId: event.run_id });
							break;
						case "message.delta":
							if (answered) throw new AssistantError("interrupted");
							if (typeof event.payload.text === "string")
								onProgress({ kind: "delta", text: event.payload.text });
							break;
						case "message.completed":
							if (answered) throw new AssistantError("interrupted");
							answered = true;
							onProgress({
								kind: "answer",
								message: parseMessage({
									id: event.payload.message_id,
									role: "assistant",
									content: event.payload.content,
									citations: event.payload.citations,
									created_at: event.timestamp,
								}),
							});
							break;
						case "run.completed":
							if (!answered) throw new AssistantError("interrupted");
							onProgress({ kind: "completed" });
							break;
						case "run.cancelled":
							onProgress({ kind: "cancelled" });
							break;
						case "run.failed":
							onProgress({ kind: "failed" });
							break;
					}
				},
				signal,
			);
			if (!terminal) throw new AssistantError("interrupted");
		},
	};
}
