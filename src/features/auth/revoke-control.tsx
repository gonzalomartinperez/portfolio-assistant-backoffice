"use client";
import { useRef, useState, useId } from "react";
import { Button } from "../../components/ui/button.tsx";
import { revokeAccess } from "./actions.ts";
import { authCopy, type AuthLocale } from "./copy.ts";
import styles from "./auth.module.css";
export function RevokeControl({
	id,
	kind,
	subject,
	locale,
}: {
	id: string;
	kind: "member" | "invitation";
	subject: string;
	locale: AuthLocale;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const titleId = useId();
	const copy = authCopy[locale];
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function confirm() {
		if (pending) return;
		setPending(true);
		setError(false);
		const data = new FormData();
		data.set("id", id);
		data.set("kind", kind);
		try {
			await revokeAccess(data);
			dialog.current?.close();
			requestAnimationFrame(() => {
				if (!trigger.current?.isConnected)
					document
						.getElementById(
							kind === "member" ? "members-title" : "invitations-title",
						)
						?.focus();
			});
		} catch {
			setError(true);
		} finally {
			setPending(false);
		}
	}
	return (
		<>
			<Button
				ref={trigger}
				onClick={() => {
					setError(false);
					dialog.current?.showModal();
				}}
			>
				{copy.revoke}
				<span className="sr-only"> {subject}</span>
			</Button>
			<dialog
				className={styles.dialog}
				ref={dialog}
				aria-labelledby={titleId}
				onClose={() => trigger.current?.focus()}
			>
				<div className={styles.stack}>
					<h2 id={titleId}>{copy.revokeTitle}</h2>
					<p>{subject}</p>
					<p>{kind === "member" ? copy.revokeMember : copy.revokeInvitation}</p>
					{error && (
						<p role="alert" className={styles.error}>
							{copy.revokeError}
						</p>
					)}
					<div className={styles.actions}>
						<Button onClick={() => dialog.current?.close()}>
							{copy.cancel}
						</Button>
						<Button disabled={pending} onClick={() => void confirm()}>
							{pending ? copy.revoking : copy.confirmRevoke}
						</Button>
					</div>
				</div>
			</dialog>
		</>
	);
}
