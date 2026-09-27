import type { components } from "../../../../contracts/types";
import type { Citation, Conversation, Message } from "../domain/models.ts";

export function record(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function text(value: unknown, max = 20_000): value is string {
	return typeof value === "string" && value.length > 0 && value.length <= max;
}
function line(value: unknown): number | undefined {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0
		? value
		: undefined;
}
export function parseCitation(value: unknown): Citation | null {
	if (
		!record(value) ||
		!text(value.id, 128) ||
		!text(value.label, 200) ||
		!text(value.url, 1000) ||
		!/^https:\/\/github\.com\/gonzalomartinperez\/portfolio\/blob\/[0-9a-f]{40}\//.test(
			value.url,
		) ||
		(value.source_type !== "page" && value.source_type !== "code")
	)
		return null;
	const wire = {
		id: value.id,
		label: value.label,
		url: value.url,
		source_type: value.source_type,
		path: text(value.path, 1000) ? value.path : undefined,
		start_line: line(value.start_line),
		end_line: line(value.end_line),
	} satisfies components["schemas"]["Citation"];
	return wire;
}
export function parseConversation(value: unknown): Conversation {
	if (
		!record(value) ||
		!text(value.id, 80) ||
		!text(value.title, 80) ||
		!text(value.created_at, 80) ||
		!text(value.updated_at, 80)
	)
		throw new Error("Invalid conversation response");
	return {
		id: value.id,
		title: value.title,
		created_at: value.created_at,
		updated_at: value.updated_at,
	} satisfies components["schemas"]["ConversationView"];
}
export function parsePage(value: unknown): {
	items: unknown[];
	cursor: string | null;
} {
	if (
		!record(value) ||
		!Array.isArray(value.items) ||
		value.items.length > 1000 ||
		(value.next_cursor != null && !text(value.next_cursor, 1000))
	)
		throw new Error("Invalid page response");
	return {
		items: value.items,
		cursor: typeof value.next_cursor === "string" ? value.next_cursor : null,
	};
}
export function parseMessage(value: unknown): Message {
	if (
		!record(value) ||
		!text(value.id, 80) ||
		(value.role !== "user" && value.role !== "assistant") ||
		typeof value.content !== "string" ||
		value.content.length > 40_000 ||
		!Array.isArray(value.citations) ||
		value.citations.length > 100 ||
		!text(value.created_at, 80)
	)
		throw new Error("Invalid message response");
	return {
		id: value.id,
		role: value.role,
		content: value.content,
		created_at: value.created_at,
		citations: value.citations
			.map(parseCitation)
			.filter((item): item is Citation => item !== null),
	} satisfies components["schemas"]["MessageView"];
}
export function parseSession(value: unknown): {
	retention_days: number;
	csrf_token: string;
} {
	if (
		!record(value) ||
		!text(value.csrf_token, 128) ||
		typeof value.retention_days !== "number" ||
		!Number.isInteger(value.retention_days) ||
		value.retention_days < 1
	)
		throw new Error("Invalid session response");
	return { retention_days: value.retention_days, csrf_token: value.csrf_token };
}
