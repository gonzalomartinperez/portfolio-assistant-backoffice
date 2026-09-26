"use client";
import {
	useEffect,
	useRef,
	useState,
	type FormEvent,
	type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import {
	cancelRun,
	conversations,
	createConversation,
	deleteConversation,
	feedback,
	getRun,
	messages,
	renameConversation,
	send,
	session,
	type Conversation,
	type Message,
} from "../lib/api";

const copy = {
	en: {
		title: "Ask about Gonzalo's work",
		intro:
			"Explore public projects, experience, and the portfolio code. Fixture mode shows deterministic source excerpts, not AI model quality.",
		new: "New chat",
		empty: "Start with a question about Filomena or the portfolio.",
		send: "Send",
		stop: "Stop",
		delete: "Delete",
		rename: "Rename",
		sources: "Sources",
		unavailable: "The assistant is unavailable. Please try again later.",
		interrupted:
			"The stream ended early. Check the saved conversation before sending again.",
		retention: "Anonymous history is kept for up to 7 days in this browser.",
		prompt: "Ask a question",
		full: "Full experience",
		theme: "Theme",
		up: "Helpful",
		down: "Not helpful",
	},
	es: {
		title: "Pregunta sobre el trabajo de Gonzalo",
		intro:
			"Explora proyectos públicos, experiencia y el código del portfolio. El modo de prueba muestra fragmentos deterministas, no calidad de un modelo de IA.",
		new: "Nueva conversación",
		empty: "Comienza con una pregunta sobre Filomena o el portfolio.",
		send: "Enviar",
		stop: "Detener",
		delete: "Eliminar",
		rename: "Renombrar",
		sources: "Fuentes",
		unavailable: "El asistente no está disponible. Intenta más tarde.",
		interrupted:
			"La transmisión se interrumpió. Revisa la conversación guardada antes de volver a enviar.",
		retention:
			"El historial anónimo se conserva hasta 7 días en este navegador.",
		prompt: "Escribe tu pregunta",
		full: "Experiencia completa",
		theme: "Tema",
		up: "Útil",
		down: "No útil",
	},
};
type Locale = "en" | "es";

export default function Chat() {
	const [locale, setLocale] = useState<Locale>("en");
	const [theme, setTheme] = useState("system");
	const [items, setItems] = useState<Conversation[]>([]);
	const [active, setActive] = useState<string | null>(null);
	const [history, setHistory] = useState<Message[]>([]);
	const [draft, setDraft] = useState("");
	const [streamText, setStreamText] = useState("");
	const [busy, setBusy] = useState(false);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState("");
	const [runId, setRunId] = useState<string | null>(null);
	const controller = useRef<AbortController | null>(null);
	const bottom = useRef<HTMLDivElement>(null);
	const nearBottom = useRef(true);
	const scrollBox = useRef<HTMLDivElement>(null);
	const t = copy[locale];

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);
	useEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [theme]);
	useEffect(() => {
		if (nearBottom.current)
			bottom.current?.scrollIntoView({ behavior: "smooth" });
	}, [history, streamText]);
	useEffect(() => {
		let mounted = true;
		session()
			.then(() => conversations())
			.then((list) => {
				if (mounted) {
					setReady(true);
					setItems(list);
					if (list[0]) setActive(list[0].id);
				}
			})
			.catch(() => {
				if (mounted) setError(copy.en.unavailable);
			});
		return () => {
			mounted = false;
		};
	}, []);
	useEffect(() => {
		if (active)
			messages(active)
				.then(setHistory)
				.catch(() => setError(t.unavailable));
		else setHistory([]);
	}, [active, t.unavailable]);

	async function newChat() {
		try {
			const item = await createConversation();
			setItems([item, ...items]);
			setActive(item.id);
			setError("");
		} catch {
			setError(t.unavailable);
		}
	}
	async function remove(id: string) {
		try {
			await deleteConversation(id);
			const rest = items.filter((item) => item.id !== id);
			setItems(rest);
			if (active === id) setActive(rest[0]?.id ?? null);
		} catch {
			setError(t.unavailable);
		}
	}
	async function rename(id: string) {
		const title = window.prompt(
			t.rename,
			items.find((item) => item.id === id)?.title,
		);
		if (!title?.trim()) return;
		try {
			await renameConversation(id, title.trim());
			setItems(
				items.map((item) =>
					item.id === id ? { ...item, title: title.trim() } : item,
				),
			);
		} catch {
			setError(t.unavailable);
		}
	}
	async function submit(event?: FormEvent) {
		event?.preventDefault();
		if (busy || !ready || !draft.trim()) return;
		const text = draft.trim();
		setDraft("");
		setError("");
		setBusy(true);
		setStreamText("");
		let current = active;
		const abort = new AbortController();
		controller.current = abort;
		let receivedRun: string | null = null;
		try {
			if (!current) {
				const created = await createConversation();
				current = created.id;
				setActive(current);
				setItems((old) => [created, ...old]);
			}
			setHistory((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					role: "user",
					content: text,
					citations: [],
					created_at: new Date().toISOString(),
				},
			]);
			const result = await send(
				current,
				text,
				locale,
				abort.signal,
				(entry) => {
					receivedRun = entry.run_id;
					setRunId(entry.run_id);
					if (entry.type === "message.delta")
						setStreamText((value) => value + String(entry.payload.text ?? ""));
					if (entry.type === "run.failed") setError(t.unavailable);
				},
			);
			if (!result.terminal) {
				const savedRun = await getRun(result.runId ?? receivedRun ?? "").catch(
					() => null,
				);
				if (savedRun?.state !== "completed") setError(t.interrupted);
			}
		} catch {
			if (!abort.signal.aborted) setError(t.unavailable);
			if (receivedRun) {
				const run = await getRun(receivedRun).catch(() => null);
				if (run?.state === "running") setError(t.interrupted);
			}
		} finally {
			setBusy(false);
			setStreamText("");
			setRunId(null);
			controller.current = null;
			if (current)
				messages(current)
					.then(setHistory)
					.catch(() => {});
		}
	}
	async function stop() {
		if (runId) await cancelRun(runId).catch(() => {});
		controller.current?.abort();
		setBusy(false);
	}
	function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			!event.nativeEvent.isComposing
		) {
			event.preventDefault();
			void submit();
		}
	}
	function onScroll() {
		const node = scrollBox.current;
		if (node)
			nearBottom.current =
				node.scrollHeight - node.scrollTop - node.clientHeight < 120;
	}
	return (
		<div className="shell">
			<aside
				className="sidebar"
				aria-label={locale === "es" ? "Conversaciones" : "Conversations"}
			>
				<div className="brand">
					GMP <span>assistant</span>
				</div>
				<button className="primary" onClick={newChat} disabled={!ready}>
					{t.new}
				</button>
				<nav className="conversation-list">
					{items.map((item) => (
						<div className="conversation" key={item.id}>
							<button
								className={active === item.id ? "selected" : ""}
								onClick={() => setActive(item.id)}
							>
								{item.title}
							</button>
							<button
								aria-label={`${t.rename} ${item.title}`}
								onClick={() => rename(item.id)}
							>
								✎
							</button>
							<button
								aria-label={`${t.delete} ${item.title}`}
								onClick={() => remove(item.id)}
							>
								×
							</button>
						</div>
					))}
				</nav>
				<p className="retention">{t.retention}</p>
			</aside>
			<main className="main">
				<header className="top">
					<div>
						<h1>{t.title}</h1>
						<p>{t.intro}</p>
					</div>
					<div className="settings">
						<label>
							<span className="sr-only">Language</span>
							<select
								value={locale}
								onChange={(e) => setLocale(e.target.value as Locale)}
							>
								<option value="en">English</option>
								<option value="es">Español</option>
							</select>
						</label>
						<label>
							<span className="sr-only">{t.theme}</span>
							<select value={theme} onChange={(e) => setTheme(e.target.value)}>
								<option value="system">System</option>
								<option value="light">Light</option>
								<option value="dark">Dark</option>
							</select>
						</label>
					</div>
				</header>
				<div
					className="messages"
					ref={scrollBox}
					onScroll={onScroll}
					role="log"
					aria-live="polite"
				>
					{history.length === 0 && <div className="empty">{t.empty}</div>}
					{history.map((message) => (
						<article className={`message ${message.role}`} key={message.id}>
							<strong>
								{message.role === "user"
									? locale === "es"
										? "Tú"
										: "You"
									: "Assistant"}
							</strong>
							<div className="markdown">
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeSanitize]}
									skipHtml
									components={{ img: () => null }}
								>
									{message.content}
								</ReactMarkdown>
							</div>
							{message.citations?.length > 0 && (
								<div className="sources">
									<strong>{t.sources}</strong>
									<ul>
										{message.citations
											.filter((citation) =>
												citation.url.startsWith(
													"https://github.com/gonzalomartinperez/portfolio/",
												),
											)
											.map((citation) => (
												<li key={citation.id}>
													<a
														href={citation.url}
														target="_blank"
														rel="noopener noreferrer"
													>
														{citation.label}
													</a>
												</li>
											))}
									</ul>
								</div>
							)}
							{message.role === "assistant" && (
								<div className="feedback">
									<button onClick={() => feedback(message.id, "up")}>
										{t.up}
									</button>
									<button onClick={() => feedback(message.id, "down")}>
										{t.down}
									</button>
								</div>
							)}
						</article>
					))}
					{busy && (
						<article className="message assistant">
							<strong>Assistant</strong>
							<p>{streamText || "…"}</p>
						</article>
					)}
					<div ref={bottom} />
				</div>
				{error && (
					<div className="error" role="alert">
						{error}
					</div>
				)}
				<form className="composer" onSubmit={submit}>
					<label className="sr-only" htmlFor="question">
						{t.prompt}
					</label>
					<textarea
						id="question"
						placeholder={t.prompt}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={onKeyDown}
						rows={2}
						maxLength={4000}
					/>
					<button
						disabled={!ready}
						type={busy ? "button" : "submit"}
						onClick={busy ? stop : undefined}
					>
						{busy ? t.stop : t.send}
					</button>
				</form>
			</main>
		</div>
	);
}
