"use client";
import { useEffect, useState } from "react";

export function SkipLink() {
	const [locale, setLocale] = useState<"en" | "es">("en");
	useEffect(() => {
		const preference = document.cookie
			.split(";")
			.map((value) => value.trim())
			.find((value) => value.startsWith("backoffice-locale="))
			?.slice("backoffice-locale=".length);
		const query = new URLSearchParams(window.location.search).get("locale");
		const value = query === "es" || query === "en" ? query : preference;
		const selected = value === "es" ? "es" : "en";
		setLocale(selected);
		document.documentElement.lang = selected;
	}, []);
	return (
		<a className="skip-link" href="#main">
			{locale === "es" ? "Ir al contenido" : "Skip to content"}
		</a>
	);
}
