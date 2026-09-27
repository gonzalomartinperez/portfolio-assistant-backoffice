const assistantOrigin = "http://localhost:3107";
const panel = document.querySelector("#panel");
const launcher = document.querySelector("#launcher");
const status = document.querySelector("#status");
const retry = document.querySelector("#retry");
let frame = null,
	initialized = false,
	operational = false,
	pendingFocus = true,
	timer;
const preferences = () => ({
	theme: document.querySelector("#theme").value,
	locale: document.querySelector("#locale").value,
});
const send = (message) =>
	frame?.contentWindow?.postMessage(
		{ version: 1, ...message },
		assistantOrigin,
	);
function minimize() {
	send({ type: "host.visibility", visible: false });
	panel.hidden = true;
	panel.inert = true;
	launcher.setAttribute("aria-expanded", "false");
	launcher.focus();
}
function focusChat() {
	if (!panel.hidden && operational && pendingFocus) {
		frame?.focus();
		send({ type: "host.focus" });
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
	timer = setTimeout(() => {
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
		send({ type: "host.visibility", visible: true });
		focusChat();
	}
};
document.querySelector("#minimize").onclick = minimize;
document.querySelector("#maximize").onclick = (event) => {
	const on = panel.classList.toggle("maximized");
	event.currentTarget.setAttribute("aria-pressed", String(on));
	event.currentTarget.textContent = on ? "Restore" : "Maximize";
};
function receive(event) {
	if (event.origin !== assistantOrigin || event.source !== frame?.contentWindow)
		return;
	const m = event.data;
	if (!m || typeof m !== "object" || m.version !== 1) return;
	if (m.type === "assistant.request-minimize" && Object.keys(m).length === 2) {
		minimize();
		return;
	}
	if (
		m.type !== "assistant.ready" ||
		Object.keys(m).length !== 3 ||
		!["initializing", "ready", "unavailable", "expired"].includes(m.status)
	)
		return;
	if (!initialized) {
		initialized = true;
		send({
			type: "host.initialize",
			preferences: preferences(),
			visible: !panel.hidden,
		});
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
function cancelDeferredFocus(event) {
	if (
		(event.type === "keydown" && event.key === "Tab") ||
		(event.type === "pointerdown" && event.target !== launcher)
	)
		pendingFocus = false;
}
document.addEventListener("keydown", cancelDeferredFocus);
document.addEventListener("pointerdown", cancelDeferredFocus);
for (const id of ["theme", "locale"])
	document.querySelector(`#${id}`).onchange = () =>
		send({ type: "host.preferences", preferences: preferences() });
retry.onclick = () => {
	frame?.remove();
	create();
};
document.querySelector("#remove").onclick = () => {
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
