"use client";
import { useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { authClient } from "./client.ts";
import { authCopy, type AuthLocale } from "./copy.ts";
import styles from "./auth.module.css";
export function LinkAccount({ locale = "en" }: { locale?: AuthLocale }) {
	const copy = authCopy[locale];
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function link(provider: "google" | "github") {
		if (pending) return;
		setPending(true);
		setError(false);
		try {
			const result = await authClient.linkSocial({
				provider,
				callbackURL: `/access?locale=${locale}`,
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
		<section className={styles.stack} aria-labelledby="link-title">
			<h2 id="link-title">{copy.linkTitle}</h2>
			<p>{copy.linkIntro}</p>
			<div className={styles.actions}>
				<Button disabled={pending} onClick={() => void link("google")}>
					{copy.linkGoogle}
				</Button>
				<Button disabled={pending} onClick={() => void link("github")}>
					{copy.linkGithub}
				</Button>
			</div>
			{error && <p role="alert">{copy.linkError}</p>}
		</section>
	);
}
