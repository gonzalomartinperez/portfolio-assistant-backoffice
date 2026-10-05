"use client";
import { useActionState, useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { inviteUser } from "./actions.ts";
import { authCopy, type AuthLocale } from "./copy.ts";
import styles from "./auth.module.css";
export function InviteForm({ locale = "en" }: { locale?: AuthLocale }) {
	const copy = authCopy[locale];
	const [state, action, pending] = useActionState(inviteUser, {
		link: null,
		error: null,
	});
	const [copiedLink, setCopiedLink] = useState<string | null>(null);
	return (
		<form className={styles.form} action={action}>
			<input type="hidden" name="locale" value={locale} />
			<label htmlFor="invite-email">{copy.guestEmail}</label>
			<input
				className={styles.input}
				id="invite-email"
				name="email"
				type="email"
				required
				maxLength={254}
				autoComplete="email"
			/>
			<Button variant="default" disabled={pending} type="submit">
				{pending ? copy.inviting : copy.invite}
			</Button>
			{state.error && (
				<p className={styles.error} role="alert">
					{state.error === "invalid-email"
						? copy.invalidEmail
						: copy.inviteError}
				</p>
			)}
			{state.link && (
				<div className={`${styles.notice} ${styles.stack}`}>
					<p>{copy.share}</p>
					<label htmlFor="invitation-link">{copy.inviteLink}</label>
					<input
						className={styles.input}
						id="invitation-link"
						readOnly
						value={state.link}
						onFocus={(event) => event.currentTarget.select()}
					/>
					<Button
						onClick={async () => {
							try {
								await navigator.clipboard.writeText(state.link ?? "");
								setCopiedLink(state.link);
							} catch {
								setCopiedLink(null);
							}
						}}
					>
						{copy.copy}
					</Button>
					<p role="status">
						{copiedLink === state.link ? copy.copied : copy.copyFallback}
					</p>
				</div>
			)}
		</form>
	);
}
