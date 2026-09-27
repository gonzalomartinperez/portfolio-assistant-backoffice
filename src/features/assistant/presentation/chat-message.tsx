"use client";
import { Button } from "../../../components/ui/button";
import { cx } from "./styles";

import { CopyAnswer } from "./copy-answer";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Message } from "../domain/models";
import { copy, type Locale } from "../../../shared/i18n/copy";

function safeUrl(url: string): string {
	return /^https:\/\//i.test(url) ? url : "";
}

export const ChatMessage = memo(function ChatMessage({
	message,
	locale,
	onFeedback,
	rating,
}: {
	message: Message;
	locale: Locale;
	onFeedback: (id: string, rating: "up" | "down") => void;
	rating: "up" | "down" | undefined;
}) {
	const t = copy[locale];
	return (
		<article className={cx(`message ${message.role}`)}>
			<div className={cx("message-meta")}>
				<span className={cx("message-avatar")} aria-hidden="true">
					{message.role === "user" ? t.you.slice(0, 1) : "G"}
				</span>
				<strong>{message.role === "user" ? t.you : t.assistant}</strong>
			</div>
			<div className={cx("message-body")}>
				<div className={cx("markdown")}>
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						rehypePlugins={[rehypeSanitize]}
						skipHtml
						urlTransform={safeUrl}
						components={{
							img: () => null,
							a: ({ children, href }) =>
								href ? (
									<a href={href} target="_blank" rel="noopener noreferrer">
										{children}
									</a>
								) : (
									<span>{children}</span>
								),
						}}
					>
						{message.content}
					</ReactMarkdown>
				</div>
				{message.citations.length > 0 && (
					<section className={cx("sources")} aria-label={t.sources}>
						<h3>{t.sources}</h3>
						<ul>
							{message.citations.map((citation) => (
								<li key={citation.id}>
									<a
										href={citation.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<span className={cx("source-kind")}>
											{citation.source_type === "code" ? t.code : t.document}
										</span>
										<span className={cx("source-title")}>
											{citation.path ?? citation.label}
										</span>
										{citation.start_line && citation.end_line && (
											<span className={cx("source-lines")}>
												L{citation.start_line ?? ""}–{citation.end_line ?? ""} ↗
											</span>
										)}
									</a>
								</li>
							))}
						</ul>
					</section>
				)}
				{message.role === "assistant" && (
					<div className={cx("answer-actions")}>
						<CopyAnswer content={message.content} locale={locale} />
						<fieldset className={cx("feedback")}>
							<legend className={cx("sr-only")}>{t.feedback}</legend>
							<Button
								type="button"
								aria-pressed={rating === "up"}
								onClick={() => onFeedback(message.id, "up")}
							>
								{t.up}
							</Button>
							<Button
								type="button"
								aria-pressed={rating === "down"}
								onClick={() => onFeedback(message.id, "down")}
							>
								{t.down}
							</Button>
							{rating && <span role="status">{t.thanks}</span>}
						</fieldset>
					</div>
				)}
			</div>
		</article>
	);
});
