"use client";
import { useState } from "react";
import { authClient } from "./client.ts";
export function SignIn() {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function signIn(provider: "google" | "github") {
		if (pending) return;
		setPending(true);
		setError(false);
		try {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: "/",
				errorCallbackURL: "/sign-in?error=access",
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
		<section aria-labelledby="sign-in-title">
			<h1 id="sign-in-title">Assistant backoffice</h1>
			<p>Private operational access. Sign in with your invited account.</p>
			<div>
				<button
					type="button"
					disabled={pending}
					onClick={() => void signIn("google")}
				>
					Continue with Google
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={() => void signIn("github")}
				>
					Continue with GitHub
				</button>
			</div>
			{pending && <p role="status">Connecting to your sign-in provider…</p>}
			{error && <p role="alert">Sign-in could not start. Please try again.</p>}
		</section>
	);
}
