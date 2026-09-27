"use client";
import { Button } from "../../../components/ui/button";
import { cx } from "./styles";

import type { Assistant } from "../application/assistant";
import { retentionText } from "../../../shared/i18n/copy";
import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { copy } from "../../../shared/i18n/copy";
import { ChatMessage } from "./chat-message";
import { useChat } from "./use-chat";

export default function Chat({ assistant }: { assistant: Assistant }) {
	const chat = useChat(assistant);
	const t = copy[chat.locale];
	const [mobileOpen, setMobileOpen] = useState(false);
	const [renaming, setRenaming] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState("");
	const [deleting, setDeleting] = useState<string | null>(null);
	const menuButton = useRef<HTMLButtonElement>(null);
	const closeButton = useRef<HTMLButtonElement>(null);
	const sidebar = useRef<HTMLElement>(null);
	const composer = useRef<HTMLTextAreaElement>(null);
	const renameInput = useRef<HTMLInputElement>(null);
	const scrollBox = useRef<HTMLDivElement>(null);
	const bottom = useRef<HTMLDivElement>(null);
	const nearBottom = useRef(true);
	const [showLatest, setShowLatest] = useState(false);
	const menuWasOpen = useRef(false);
	const { history, streamText } = chat;
	const editFocus = useRef<string | null>(null);
	const deleteCancel = useRef<HTMLButtonElement>(null);
	const newChatButton = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (deleting) deleteCancel.current?.focus();
	}, [deleting]);
	useEffect(() => {
		if (renaming || deleting || chat.mutation || !editFocus.current) return;
		const target = Array.from(
			sidebar.current?.querySelectorAll<HTMLButtonElement>(
				"button[data-conversation-id]",
			) ?? [],
		).find((button) => button.dataset.conversationId === editFocus.current);
		(
			target ??
			sidebar.current?.querySelector<HTMLButtonElement>(
				"button[data-conversation-id]",
			) ??
			newChatButton.current
		)?.focus();
		editFocus.current = null;
	}, [renaming, deleting, chat.mutation]);

	useEffect(() => {
		if (mobileOpen) {
			menuWasOpen.current = true;
			closeButton.current?.focus();
		} else if (menuWasOpen.current) menuButton.current?.focus();
	}, [mobileOpen]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Message and delta changes trigger conditional scrolling; the ref is the value read by the effect.
	useEffect(() => {
		if (nearBottom.current) bottom.current?.scrollIntoView({ block: "end" });
	}, [history, streamText]);
	useEffect(() => {
		if (renaming) renameInput.current?.focus();
	}, [renaming]);

	useEffect(() => {
		const media = window.matchMedia("(min-width: 901px)");
		const update = () => {
			if (media.matches) setMobileOpen(false);
		};
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);
	function closeMenu() {
		setMobileOpen(false);
	}
	function sidebarKeys(event: KeyboardEvent<HTMLElement>) {
		if (!mobileOpen) return;
		if (event.key === "Escape") {
			event.preventDefault();
			closeMenu();
		}
		if (event.key !== "Tab") return;
		const focusable = Array.from(
			sidebar.current?.querySelectorAll<HTMLElement>(
				"button:not([disabled]), input:not([disabled]), a[href]",
			) ?? [],
		);
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
	function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			!event.nativeEvent.isComposing &&
			event.nativeEvent.keyCode !== 229
		) {
			event.preventDefault();
			void chat.submit();
		}
	}
	function startRename(id: string, title: string) {
		editFocus.current = id;
		setDeleting(null);
		setRenaming(id);
		setRenameDraft(title);
	}
	function onScroll() {
		const node = scrollBox.current;
		if (node) {
			nearBottom.current =
				node.scrollHeight - node.scrollTop - node.clientHeight < 120;
			setShowLatest(!nearBottom.current);
		}
	}
	const runningHere =
		chat.busy &&
		(chat.runConversation === chat.active || chat.runConversation === null);
	return (
		<div className={cx("shell")}>
			<a className={cx("skip-link")} href="#question">
				{t.skip}
			</a>
			{mobileOpen && (
				<Button
					type="button"
					className={cx("sidebar-backdrop")}
					aria-label={t.closeBackdrop}
					onClick={closeMenu}
				/>
			)}
			<aside
				ref={sidebar}
				className={cx(`sidebar ${mobileOpen ? "sidebar-open" : ""}`)}
				aria-label={t.menu}
				{...(mobileOpen ? { role: "dialog", "aria-modal": true } : {})}
				onKeyDown={sidebarKeys}
			>
				<div className={cx("sidebar-heading")}>
					<a
						className={cx("brand")}
						href="https://gonzalomartinperez.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Image
							unoptimized
							src="/avatar.png"
							width={36}
							height={36}
							alt=""
						/>
						<span>{t.brand}</span>
					</a>
					<Button
						ref={closeButton}
						className={cx("sidebar-close")}
						type="button"
						aria-label={t.close}
						onClick={closeMenu}
					>
						×
					</Button>
				</div>
				<Button
					type="button"
					ref={newChatButton}
					className={cx("primary new-chat")}
					onClick={() => {
						void chat.newChat();
						setMobileOpen(false);
					}}
					disabled={!chat.ready || chat.busy || chat.mutation}
				>
					<span aria-hidden="true">＋</span> {t.new}
				</Button>
				<div className={cx("list-heading")}>{t.menu}</div>
				<nav className={cx("conversation-list")} aria-label={t.menu}>
					{chat.items.length === 0 && (
						<p className={cx("no-conversations")}>{t.noConversations}</p>
					)}
					{chat.items.map((item) => (
						<div
							className={cx(
								`conversation ${chat.active === item.id ? "selected" : ""}`,
							)}
							key={item.id}
						>
							{renaming === item.id ? (
								<form
									className={cx("inline-edit")}
									onSubmit={(event) => {
										event.preventDefault();
										void chat.rename(item.id, renameDraft);
										setRenaming(null);
									}}
								>
									<input
										ref={renameInput}
										aria-label={t.rename}
										maxLength={80}
										value={renameDraft}
										onChange={(event) => setRenameDraft(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Escape") setRenaming(null);
										}}
									/>
									<Button type="submit" aria-label={t.save}>
										{t.save}
									</Button>
									<Button
										type="button"
										aria-label={t.cancel}
										onClick={() => setRenaming(null)}
									>
										{t.cancel}
									</Button>
								</form>
							) : deleting === item.id ? (
								<div className={cx("inline-confirm")}>
									<span>{t.confirmDelete}</span>
									<Button
										type="button"
										onClick={() => {
											void chat.remove(item.id);
											setDeleting(null);
										}}
									>
										{t.confirm}
									</Button>
									<Button
										type="button"
										ref={deleteCancel}
										onClick={() => setDeleting(null)}
									>
										{t.cancel}
									</Button>
								</div>
							) : (
								<>
									<Button
										className={cx("conversation-title")}
										data-conversation-id={item.id}
										type="button"
										disabled={chat.busy || chat.mutation}
										aria-current={chat.active === item.id ? "page" : undefined}
										onClick={() => {
											chat.selectConversation(item.id);
											setMobileOpen(false);
										}}
									>
										{item.title === "New conversation"
											? t.untitled
											: item.title}
									</Button>
									<Button
										className={cx("icon-button")}
										type="button"
										disabled={chat.busy || chat.mutation}
										aria-label={`${t.rename} ${item.title === "New conversation" ? t.untitled : item.title}`}
										onClick={() => startRename(item.id, item.title)}
									>
										✎
									</Button>
									<Button
										className={cx("icon-button")}
										type="button"
										disabled={chat.busy || chat.mutation}
										aria-label={`${t.delete} ${item.title === "New conversation" ? t.untitled : item.title}`}
										onClick={() => {
											setRenaming(null);
											editFocus.current = item.id;
											setDeleting(item.id);
										}}
									>
										×
									</Button>
								</>
							)}
						</div>
					))}
				</nav>
				<div className={cx("sidebar-footer")}>
					<span className={cx("status-dot")} aria-hidden="true" />
					<p>
						{chat.retentionDays
							? retentionText(chat.locale, chat.retentionDays)
							: t.initializing}
					</p>
				</div>
			</aside>
			<main className={cx("main")} inert={mobileOpen}>
				<header className={cx("top")}>
					<div className={cx("top-title")}>
						<Button
							ref={menuButton}
							className={cx("menu-button")}
							type="button"
							aria-label={t.menu}
							aria-expanded={mobileOpen}
							onClick={() => setMobileOpen(true)}
						>
							☰
						</Button>
						<div>
							<p className={cx("eyebrow")}>{t.collection}</p>
							<h1>{t.title}</h1>
							<p className={cx("intro")}>{t.subtitle}</p>
						</div>
					</div>
					<div className={cx("settings")}>
						<label>
							<span className={cx("sr-only")}>{t.language}</span>
							<select
								value={chat.locale}
								onChange={(event) => {
									if (
										event.target.value === "en" ||
										event.target.value === "es"
									)
										chat.setLocale(event.target.value);
								}}
							>
								<option value="en">English</option>
								<option value="es">Español</option>
							</select>
						</label>
						<label>
							<span className={cx("sr-only")}>{t.theme}</span>
							<select
								value={chat.theme}
								onChange={(event) => {
									const value = event.target.value;
									if (
										value === "dark" ||
										value === "light" ||
										value === "system"
									)
										chat.setTheme(value);
								}}
							>
								<option value="dark">{t.dark}</option>
								<option value="light">{t.light}</option>
								<option value="system">{t.system}</option>
							</select>
						</label>
					</div>
				</header>
				<div className={cx("context-notice")} role="note">
					<span className={cx("status-dot")} aria-hidden="true" />
					{t.intro}
				</div>
				<p className={cx("sr-only")} role="status">
					{chat.lifecycle.kind === "initializing"
						? t.initializing
						: chat.busy
							? t.thinking
							: chat.lifecycle.kind === "completed"
								? t.completed
								: chat.lifecycle.kind === "cancelled"
									? t.cancelled
									: ""}
				</p>
				<div
					className={cx("messages")}
					ref={scrollBox}
					onScroll={onScroll}
					role="log"
					aria-label={t.title}
					aria-live="off"
				>
					{chat.historyLoading && <p role="status">{t.historyLoading}</p>}
					{chat.history.length === 0 &&
						!runningHere &&
						!chat.historyLoading && (
							<section className={cx("empty")}>
								<div className={cx("empty-avatar")}>
									<Image
										src="/avatar.png"
										width={88}
										height={88}
										alt=""
										priority
									/>
								</div>
								<p className={cx("eyebrow")}>GONZALO MARTIN PEREZ</p>
								<h2>{t.emptyTitle}</h2>
								<p>{t.empty}</p>
								<div className={cx("examples")}>
									{t.examples.map((example) => (
										<Button
											key={example}
											type="button"
											onClick={() => {
												chat.setDraft(example);
												composer.current?.focus();
											}}
										>
											{example}
											<span aria-hidden="true">↗</span>
										</Button>
									))}
								</div>
							</section>
						)}
					{chat.history.map((message) => (
						<ChatMessage
							key={message.id}
							message={message}
							locale={chat.locale}
							onFeedback={chat.rate}
							rating={chat.ratings[message.id]}
						/>
					))}
					{(runningHere || chat.streamText) && (
						<article className={cx("message assistant streaming")}>
							<div className={cx("message-meta")}>
								<span className={cx("message-avatar")} aria-hidden="true">
									G
								</span>
								<strong>{t.assistant}</strong>
							</div>
							<div className={cx("message-body")}>
								{!chat.busy && (
									<div>
										<p className={cx("partial-label")}>{t.partial}</p>
										{!chat.error && (
											<Button
												disabled={chat.historyLoading}
												onClick={() => void chat.reload()}
											>
												{t.retry}
											</Button>
										)}
									</div>
								)}
								<pre>{chat.streamText || t.thinking}</pre>
							</div>
						</article>
					)}
					<div ref={bottom} />
				</div>
				{showLatest && (
					<Button
						className={cx("jump-latest")}
						type="button"
						onClick={() => {
							nearBottom.current = true;
							setShowLatest(false);
							bottom.current?.scrollIntoView({ block: "end" });
						}}
					>
						{t.jump} ↓
					</Button>
				)}
				{chat.error && (
					<div className={cx("error")} role="alert">
						<span>{chat.error}</span>
						<Button
							type="button"
							onClick={() => {
								void chat.reload();
							}}
						>
							{chat.lifecycle.kind === "expired" ||
							chat.lifecycle.kind === "unavailable"
								? t.reconnect
								: t.retry}
						</Button>
					</div>
				)}
				<form
					className={cx("composer")}
					onSubmit={(event) => {
						void chat.submit(event);
					}}
				>
					<label className={cx("sr-only")} htmlFor="question">
						{t.prompt}
					</label>
					<textarea
						ref={composer}
						id="question"
						placeholder={t.prompt}
						value={chat.draft}
						onChange={(event) => chat.setDraft(event.target.value)}
						onKeyDown={submitOnEnter}
						rows={2}
						maxLength={4000}
					/>
					<Button
						className={cx("primary send-button")}
						disabled={
							runningHere ? false : !chat.canSubmit || !chat.draft.trim()
						}
						type={runningHere ? "button" : "submit"}
						onClick={
							runningHere
								? () => {
										void chat.stop();
									}
								: undefined
						}
					>
						{runningHere ? t.stop : t.send}
						<span aria-hidden="true">{runningHere ? "■" : "↗"}</span>
					</Button>
					<p className={cx("composer-note")}>{t.composerNote}</p>
				</form>
			</main>
		</div>
	);
}
