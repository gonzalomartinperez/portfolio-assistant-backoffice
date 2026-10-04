"use client";
import { useActionState, useState } from "react";
import { inviteUser } from "./actions.ts";
export function InviteForm() {
	const [state, action, pending] = useActionState(inviteUser, {
		link: null,
		error: null,
	});
	const [copied, setCopied] = useState(false);
	return (
		<form action={action}>
			<label htmlFor="invite-email">Guest email</label>
			<input
				id="invite-email"
				name="email"
				type="email"
				required
				maxLength={254}
				autoComplete="email"
			/>
			<button disabled={pending} type="submit">
				{pending ? "Creating invitation…" : "Invite viewer"}
			</button>
			{state.error && <p role="alert">{state.error}</p>}
			{state.link && (
				<div>
					<p>
						Share this one-use link privately. It expires in 48 hours and
						requires the invited account.
					</p>
					<label htmlFor="invitation-link">Invitation link</label>
					<input
						id="invitation-link"
						readOnly
						value={state.link}
						onFocus={(event) => event.currentTarget.select()}
					/>
					<button
						type="button"
						onClick={async () => {
							try {
								await navigator.clipboard.writeText(state.link ?? "");
								setCopied(true);
							} catch {
								setCopied(false);
							}
						}}
					>
						Copy link
					</button>
					<p role="status">
						{copied
							? "Copied."
							: "Select the link to copy it manually if needed."}
					</p>
				</div>
			)}
		</form>
	);
}
