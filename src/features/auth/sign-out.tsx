"use client";
import { useState } from "react";
import { authClient } from "./client.ts";
export function SignOut({ label = "Sign out" }: { label?: string }) {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function signOut() {
		setPending(true);
		setError(false);
		try {
			const result = await authClient.signOut();
			if (result.error) {
				setPending(false);
				setError(true);
			} else window.location.assign("/sign-in");
		} catch {
			setPending(false);
			setError(true);
		}
	}
	return (
		<>
			<button type="button" disabled={pending} onClick={() => void signOut()}>
				{label}
			</button>
			{error && <p role="alert">Could not sign out. Try again.</p>}
		</>
	);
}
