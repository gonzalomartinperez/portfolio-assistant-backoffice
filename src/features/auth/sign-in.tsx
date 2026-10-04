"use client";
import { useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { authClient } from "./client.ts";
import { authCopy, type AuthLocale } from "./copy.ts";
import styles from "./auth.module.css";
export function SignIn({
	locale = "en",
	unavailable = false,
}: {
	locale?: AuthLocale;
	unavailable?: boolean;
}) {
	const copy = authCopy[locale];
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function signIn(provider: "google" | "github") {
		if (pending || unavailable) return;
		setPending(true);
		setError(false);
		try {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: `/?locale=${locale}`,
				errorCallbackURL: `/sign-in?locale=${locale}&error=access`,
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
		<section
			className={`${styles.card} ${styles.stack}`}
			aria-labelledby="sign-in-title"
		>
			<h1 id="sign-in-title">{copy.title}</h1>
			<p>{copy.intro}</p>
			<nav className={styles.actions} aria-label={copy.language}>
				<a
					className={styles.link}
					href="/sign-in?locale=en"
					hrefLang="en"
					aria-current={locale === "en" ? "page" : undefined}
				>
					English
				</a>
				<a
					className={styles.link}
					href="/sign-in?locale=es"
					hrefLang="es"
					aria-current={locale === "es" ? "page" : undefined}
				>
					Español
				</a>
			</nav>
			<div className={styles.actions}>
				<Button
					variant="default"
					disabled={pending || unavailable}
					onClick={() => void signIn("google")}
				>
					{copy.google}
				</Button>
				<Button
					disabled={pending || unavailable}
					onClick={() => void signIn("github")}
				>
					{copy.github}
				</Button>
			</div>
			{pending && <p role="status">{copy.connecting}</p>}
			{error && (
				<p className={styles.error} role="alert">
					{copy.signInError}
				</p>
			)}
		</section>
	);
}
