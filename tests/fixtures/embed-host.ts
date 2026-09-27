import type {
	HostMessage,
	EmbedPreferences,
} from "../../src/features/embed/protocol.ts";
function element<T extends Element>(selector: string, kind: { new (): T }): T {
	const value = document.querySelector(selector);
	if (!(value instanceof kind))
		throw new Error(`Missing fixture element: ${selector}`);
	return value;
}
const assistantOrigin = "http://localhost:3107";
const panel = element("#panel", HTMLElement);
const launcher = element("#launcher", HTMLButtonElement);
const status = element("#status", HTMLElement);
const retry = element("#retry", HTMLButtonElement);
let frame: HTMLIFrameElement | null = null;
let initialized = false,
	operational = false,
	pendingFocus = true,
	timer: number | undefined;
const preferences = (): EmbedPreferences => ({
	theme:
		element("#theme", HTMLSelectElement).value === "light" ? "light" : "dark",
	locale: element("#locale", HTMLSelectElement).value === "es" ? "es" : "en",
});
const send = (message: HostMessage) =>
	frame?.contentWindow?.postMessage(message, assistantOrigin);
function minimize() {
	send({ version: 1, type: "host.visibility", visible: false });
	panel.hidden = true;
	panel.inert = true;
	launcher.setAttribute("aria-expanded", "false");
	launcher.focus();
}
function focusChat() {
	if (!panel.hidden && operational && pendingFocus) {
		frame?.focus();
		send({ version: 1, type: "host.focus" });
		pendingFocus = false;
	}
}
function create() {
	initialized = false;
	operational = false;
	status.textContent = "Connecting…";
	retry.hidden = true;
	frame = document.createElement("iframe");
	frame.title = "Gonzalo’s AI assistant conversation";
	frame.allow = "clipboard-write";
	const params = new URLSearchParams(preferences());
	frame.src = `${assistantOrigin}/embed?${params}`;
	panel.append(frame);
	clearTimeout(timer);
	timer = window.setTimeout(() => {
		status.textContent =
			"Assistant did not become ready. Retry the connection.";
		retry.hidden = false;
	}, 8000);
}
launcher.onclick = () => {
	pendingFocus = true;
	panel.hidden = false;
	panel.inert = false;
	launcher.setAttribute("aria-expanded", "true");
	if (!frame) create();
	else {
		send({ version: 1, type: "host.visibility", visible: true });
		focusChat();
	}
};
element("#minimize", HTMLButtonElement).onclick = minimize;
const maximize = element("#maximize", HTMLButtonElement);
maximize.onclick = () => {
	const on = panel.classList.toggle("maximized");
	maximize.setAttribute("aria-pressed", String(on));
	maximize.textContent = on ? "Restore" : "Maximize";
};
function receive(event: MessageEvent<unknown>) {
	if (event.origin !== assistantOrigin || event.source !== frame?.contentWindow)
		return;
	const m = event.data;
	if (
		!m ||
		typeof m !== "object" ||
		!("version" in m) ||
		m.version !== 1 ||
		!("type" in m)
	)
		return;
	if (m.type === "assistant.request-minimize" && Object.keys(m).length === 2) {
		minimize();
		return;
	}
	if (
		m.type !== "assistant.ready" ||
		Object.keys(m).length !== 3 ||
		!("status" in m) ||
		typeof m.status !== "string" ||
		!["initializing", "ready", "unavailable", "expired"].includes(m.status)
	)
		return;
	if (!initialized) {
		initialized = true;
		send({
			version: 1,
			type: "host.initialize",
			preferences: preferences(),
			visible: !panel.hidden,
		});
		return;
	}

	operational = m.status === "ready";
	status.textContent = operational
		? "Connected"
		: m.status === "initializing"
			? "Connecting…"
			: "Assistant unavailable. Use the conversation reconnect action.";
	if (m.status !== "initializing") {
		clearTimeout(timer);
		retry.hidden = true;
	}
	if (operational) focusChat();
}
window.addEventListener("message", receive);
function cancelDeferredFocus(event: KeyboardEvent | PointerEvent) {
	if (
		(event instanceof KeyboardEvent && event.key === "Tab") ||
		(event.type === "pointerdown" && event.target !== launcher)
	)
		pendingFocus = false;
}
document.addEventListener("keydown", cancelDeferredFocus);
document.addEventListener("pointerdown", cancelDeferredFocus);
for (const id of ["theme", "locale"])
	element(`#${id}`, HTMLSelectElement).onchange = () =>
		send({ version: 1, type: "host.preferences", preferences: preferences() });
retry.onclick = () => {
	frame?.remove();
	create();
};
element("#remove", HTMLButtonElement).onclick = () => {
	clearTimeout(timer);
	frame?.remove();
	frame = null;
	window.removeEventListener("message", receive);
	document.removeEventListener("keydown", cancelDeferredFocus);
	document.removeEventListener("pointerdown", cancelDeferredFocus);
	panel.remove();
	launcher.remove();
};
panel.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		event.preventDefault();
		minimize();
	}
});
