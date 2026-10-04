"use client";
import { useState } from "react";
import { authClient } from "./client.ts";
export function LinkAccount() {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function link(provider: "google" | "github") {
		if (pending) return;
		setPending(true);
		setError(false);
		try {
			const result = await authClient.linkSocial({
				provider,
				callbackURL: "/access",
			});
			if (result.error) {
				setError(true);
				setPending(false);
			}
		} catch {
			setError(true);
			setPending(false);
		}
	}
	return (
		<section aria-labelledby="link-title">
			<h2 id="link-title">Link another sign-in account</h2>
			<p>Link only accounts you own. Your current session is required.</p>
			<button
				type="button"
				disabled={pending}
				onClick={() => void link("google")}
			>
				Link Google
			</button>
			<button
				type="button"
				disabled={pending}
				onClick={() => void link("github")}
			>
				Link GitHub
			</button>
			{error && (
				<p role="alert">The account could not be linked. Please try again.</p>
			)}
		</section>
	);
}
