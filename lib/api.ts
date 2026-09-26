import { readSse, type StreamEvent } from "./sse";

import type { components } from "../contracts/types";
export type Citation = components["schemas"]["Citation"];
export type Message = components["schemas"]["MessageView"];
export type Conversation = components["schemas"]["ConversationView"];
export type Run = components["schemas"]["RunView"];
const base =
	process.env.NEXT_PUBLIC_ASSISTANT_API_URL ?? "http://localhost:8000";
let csrf: string | null = null;
let sessionPromise: Promise<{ retention_days: number }> | null = null;

async function request(path: string, init: RequestInit = {}) {
	const response = await fetch(`${base}${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(csrf && init.method && init.method !== "GET"
				? { "X-CSRF-Token": csrf }
				: {}),
			...init.headers,
		},
	});
	if (!response.ok)
		throw new Error(
			(await response.json().catch(() => ({}))).code ??
				`HTTP ${response.status}`,
		);
	return response;
}

export function session(): Promise<{ retention_days: number }> {
	if (sessionPromise) return sessionPromise;
	sessionPromise = (async () => {
		let response = await fetch(`${base}/api/v1/session`, {
			credentials: "include",
		});
		if (response.status === 401)
			response = await request("/api/v1/session", {
				method: "POST",
				headers: { "X-Session-Bootstrap": "1" },
				body: "{}",
			});
		if (!response.ok) throw new Error("Session unavailable");
		const data = await response.json();
		csrf = data.csrf_token;
		return data as { retention_days: number };
	})().catch((error) => {
		sessionPromise = null;
		throw error;
	});
	return sessionPromise;
}
export async function conversations(): Promise<Conversation[]> {
	return (await (await request("/api/v1/conversations")).json()).items;
}
export async function createConversation(): Promise<Conversation> {
	return (
		await request("/api/v1/conversations", { method: "POST", body: "{}" })
	).json();
}
export async function renameConversation(id: string, title: string) {
	await request(`/api/v1/conversations/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ title }),
	});
}
export async function deleteConversation(id: string) {
	await request(`/api/v1/conversations/${id}`, { method: "DELETE" });
}
export async function messages(id: string): Promise<Message[]> {
	return (
		await (await request(`/api/v1/conversations/${id}/messages`)).json()
	).items.reverse();
}
export async function feedback(id: string, rating: "up" | "down") {
	await request(`/api/v1/messages/${id}/feedback`, {
		method: "POST",
		body: JSON.stringify({ rating }),
	});
}
export async function getRun(id: string): Promise<Run> {
	return (await request(`/api/v1/runs/${id}`)).json();
}
export async function cancelRun(id: string) {
	await request(`/api/v1/runs/${id}/cancel`, { method: "POST", body: "{}" });
}
export async function send(
	id: string,
	content: string,
	locale: "en" | "es",
	signal: AbortSignal,
	onEvent: (event: StreamEvent) => void,
) {
	const response = await request(
		`/api/v1/conversations/${id}/messages/stream`,
		{
			method: "POST",
			signal,
			headers: { "Idempotency-Key": crypto.randomUUID() },
			body: JSON.stringify({ content, locale }),
		},
	);
	const runId = response.headers.get("X-Run-ID");
	if (!response.body) throw new Error("Stream unavailable");
	const terminal = await readSse(response.body, onEvent);
	return { terminal, runId };
}
