export const EMBED_VERSION = 1;
export type EmbedPreferences = { theme: "dark" | "light"; locale: "en" | "es" };
export type HostMessage =
	| {
			version: 1;
			type: "host.initialize";
			preferences: EmbedPreferences;
			visible: boolean;
	  }
	| { version: 1; type: "host.preferences"; preferences: EmbedPreferences }
	| { version: 1; type: "host.visibility"; visible: boolean }
	| { version: 1; type: "host.focus" };
export type EmbedStatus = "initializing" | "ready" | "unavailable" | "expired";
export type AssistantMessage =
	| { version: 1; type: "assistant.ready"; status: EmbedStatus }
	| { version: 1; type: "assistant.request-minimize" };
function record(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, expected: string[]) {
	return (
		Object.keys(value).length === expected.length &&
		expected.every((key) => Object.hasOwn(value, key))
	);
}
function preferences(value: unknown): value is EmbedPreferences {
	return (
		record(value) &&
		keys(value, ["theme", "locale"]) &&
		(value.theme === "dark" || value.theme === "light") &&
		(value.locale === "en" || value.locale === "es")
	);
}
export function parseHostMessage(value: unknown): HostMessage | null {
	if (!record(value) || value.version !== EMBED_VERSION) return null;
	switch (value.type) {
		case "host.initialize":
			return keys(value, ["version", "type", "preferences", "visible"]) &&
				preferences(value.preferences) &&
				typeof value.visible === "boolean"
				? {
						version: 1,
						type: value.type,
						preferences: value.preferences,
						visible: value.visible,
					}
				: null;
		case "host.preferences":
			return keys(value, ["version", "type", "preferences"]) &&
				preferences(value.preferences)
				? { version: 1, type: value.type, preferences: value.preferences }
				: null;
		case "host.visibility":
			return keys(value, ["version", "type", "visible"]) &&
				typeof value.visible === "boolean"
				? { version: 1, type: value.type, visible: value.visible }
				: null;
		case "host.focus":
			return keys(value, ["version", "type"])
				? { version: 1, type: value.type }
				: null;
		default:
			return null;
	}
}
