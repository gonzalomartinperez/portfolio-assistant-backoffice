import type {
	Conversation,
	Failure,
	Locale,
	Message,
	Progress,
} from "../domain/models.ts";
export class AssistantError extends Error {
	readonly reason: Failure;
	constructor(reason: Failure) {
		super(reason);
		this.reason = reason;
	}
}
export interface AssistantTransport {
	session(signal: AbortSignal): Promise<{ retention_days: number }>;
	conversations(signal: AbortSignal): Promise<Conversation[]>;
	createConversation(signal: AbortSignal): Promise<Conversation>;
	messages(id: string, signal: AbortSignal): Promise<Message[]>;
	renameConversation(
		id: string,
		title: string,
		signal: AbortSignal,
	): Promise<void>;
	deleteConversation(id: string, signal: AbortSignal): Promise<void>;
	feedback(
		id: string,
		rating: "up" | "down",
		signal: AbortSignal,
	): Promise<void>;
	cancelRun(id: string, signal: AbortSignal): Promise<void>;
	send(
		id: string,
		content: string,
		locale: Locale,
		signal: AbortSignal,
		onProgress: (event: Progress) => void,
		key: string,
	): Promise<void>;
}
export interface Runtime {
	id(): string;
	now(): string;
}
