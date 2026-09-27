"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Assistant } from "../assistant/application/assistant";
import {
	parseHostMessage,
	type AssistantMessage,
	type EmbedPreferences,
	type EmbedStatus,
} from "./protocol";
export type EmbedOptions = {
	allowedOrigins: string[];
	initialPreferences: EmbedPreferences;
};
export function useEmbed(assistant: Assistant, options?: EmbedOptions) {
	const [preferences, setPreferences] = useState(options?.initialPreferences);
	const [visible, setVisible] = useState(!options);
	const visibleRef = useRef(!options);
	const [focus, setFocus] = useState(0);
	const origin = useRef<string | null>(null);
	const status = useSyncExternalStore<EmbedStatus>(
		assistant.subscribe,
		(): EmbedStatus => {
			const state = assistant.getSnapshot();
			const kind = state.lifecycle.kind;
			return kind === "initializing" ||
				kind === "unavailable" ||
				kind === "expired"
				? kind
				: state.historyLoading
					? "initializing"
					: "ready";
		},
		() => "initializing",
	);
	const latestStatus = useRef(status);
	latestStatus.current = status;
	useEffect(() => {
		if (!options) return;
		if (window.parent === window) {
			setVisible(true);
			return;
		}
		function send(message: AssistantMessage, target: string) {
			window.parent.postMessage(message, target);
		}
		function receive(event: MessageEvent<unknown>) {
			if (
				event.source !== window.parent ||
				!options?.allowedOrigins.includes(event.origin)
			)
				return;
			const message = parseHostMessage(event.data);
			if (!message) return;
			if (message.type === "host.initialize") {
				if (origin.current && origin.current !== event.origin) return;
				origin.current = event.origin;
				setPreferences(message.preferences);
				visibleRef.current = message.visible;
				setVisible(message.visible);
				send(
					{ version: 1, type: "assistant.ready", status: latestStatus.current },
					event.origin,
				);
			} else if (origin.current === event.origin) {
				if (message.type === "host.preferences")
					setPreferences(message.preferences);
				if (message.type === "host.visibility") {
					visibleRef.current = message.visible;
					setVisible(message.visible);
				}
				if (message.type === "host.focus" && visibleRef.current)
					setFocus((count) => count + 1);
			}
		}
		function onEscape(event: KeyboardEvent) {
			if (event.key === "Escape" && !event.defaultPrevented && origin.current) {
				send(
					{ version: 1, type: "assistant.request-minimize" },
					origin.current,
				);
			}
		}
		window.addEventListener("message", receive);
		window.addEventListener("keydown", onEscape);
		for (const target of options.allowedOrigins)
			send(
				{ version: 1, type: "assistant.ready", status: latestStatus.current },
				target,
			);
		return () => {
			window.removeEventListener("message", receive);
			window.removeEventListener("keydown", onEscape);
			origin.current = null;
		};
	}, [options]);
	useEffect(() => {
		if (options && origin.current)
			window.parent.postMessage(
				{
					version: 1,
					type: "assistant.ready",
					status,
				} satisfies AssistantMessage,
				origin.current,
			);
	}, [status, options]);
	return options
		? { preferences: preferences ?? options.initialPreferences, visible, focus }
		: undefined;
}
export type EmbedPresentation = NonNullable<ReturnType<typeof useEmbed>>;
