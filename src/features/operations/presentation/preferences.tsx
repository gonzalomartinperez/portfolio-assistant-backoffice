"use client";
import { useEffect, useState } from "react";
import { operationsCopy, type OperationsLocale } from "./copy";
export function Preferences({ locale }: { locale: OperationsLocale }) {
	const t = operationsCopy[locale];
	const [theme, setTheme] = useState("dark");
	useEffect(() => {
		document.documentElement.lang = locale;
		setTheme(
			document.documentElement.dataset.theme === "light" ? "light" : "dark",
		);
	}, [locale]);
	return (
		<details>
			<summary>{t.preferences}</summary>
			<div className="settings-fields">
				<label>
					{t.language}
					<select
						value={locale}
						onChange={(event) => {
							const target = new URL(window.location.href);
							const nextLocale = event.target.value === "es" ? "es" : "en";
							target.searchParams.set("locale", nextLocale);
							document.cookie = `backoffice-locale=${nextLocale}; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
							window.location.assign(target);
						}}
					>
						<option value="en">English</option>
						<option value="es">Español</option>
					</select>
				</label>
				<label>
					{t.theme}
					<select
						value={theme}
						onChange={(event) => {
							const value = event.target.value === "light" ? "light" : "dark";
							setTheme(value);
							document.documentElement.dataset.theme = value;
							try {
								localStorage.setItem("assistant-theme", value);
							} catch {
								/* Preference changes still apply when storage is blocked. */
							}
						}}
					>
						<option value="dark">{t.dark}</option>
						<option value="light">{t.light}</option>
					</select>
				</label>
			</div>
		</details>
	);
}
