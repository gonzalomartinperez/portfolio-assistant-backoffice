"use client";
import { useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { authClient } from "./client.ts";
import { authCopy, type AuthLocale } from "./copy.ts";
export function SignOut({
	label,
	locale = "en",
}: {
	label?: string;
	locale?: AuthLocale;
}) {
	const copy = authCopy[locale];
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function signOut() {
		if (pending) return;
		setPending(true);
		setError(false);
		try {
			const result = await authClient.signOut();
			if (result.error) {
				setPending(false);
				setError(true);
			} else window.location.assign(`/sign-in?locale=${locale}`);
		} catch {
			setPending(false);
			setError(true);
		}
	}
	return (
		<>
			<Button disabled={pending} onClick={() => void signOut()}>
				{label ?? copy.signOut}
			</Button>
			{error && <p role="alert">{copy.signOutError}</p>}
		</>
	);
}
