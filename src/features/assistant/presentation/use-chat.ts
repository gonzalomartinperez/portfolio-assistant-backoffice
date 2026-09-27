"use client";
import {
	useEffect,
	useState,
	useSyncExternalStore,
	type FormEvent,
} from "react";
import type { Assistant } from "../application/assistant";
import { canSubmit, isRunning } from "../domain/models";
import { copy } from "../../../shared/i18n/copy";
import { usePreferences } from "../../../shared/theme/use-preferences";
export function useChat(assistant: Assistant) {
	const state = useSyncExternalStore(
		assistant.subscribe,
		assistant.getSnapshot,
		assistant.getSnapshot,
	);
	const preferences = usePreferences();
	const [draft, setDraft] = useState("");
	useEffect(() => {
		assistant.start();
		return assistant.dispose;
	}, [assistant]);
	const t = copy[preferences.locale];
	const busy = isRunning(state.lifecycle);
	return {
		...state,
		...preferences,
		draft,
		setDraft,
		busy,
		ready: !["initializing", "unavailable", "expired"].includes(
			state.lifecycle.kind,
		),
		canSubmit: canSubmit(state),
		error: state.notice ? t[state.notice] : "",
		streamText:
			state.partial?.conversationId === state.active
				? state.partial.content
				: "",
		runConversation:
			state.lifecycle.kind === "streaming" ||
			state.lifecycle.kind === "submitting"
				? state.lifecycle.conversationId
				: null,
		selectConversation: assistant.selectConversation,
		reload: assistant.recover,
		newChat: assistant.newChat,
		remove: assistant.remove,
		rename: assistant.rename,
		stop: assistant.stop,
		rate: assistant.rate,
		async submit(event?: FormEvent) {
			event?.preventDefault();
			const question = draft;
			if (!canSubmit(state)) return;
			setDraft("");
			if (!(await assistant.submit(question, preferences.locale)))
				setDraft(question);
		},
	};
}
