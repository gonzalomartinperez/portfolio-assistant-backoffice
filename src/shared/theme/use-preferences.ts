"use client";
import { useEffect, useState } from "react";
import { copy, type Locale } from "../i18n/copy";
export type Theme = "dark" | "light" | "system";
export function usePreferences(controlled?: {
	locale: Locale;
	theme: "dark" | "light";
}) {
	const [locale, setLocale] = useState<Locale>("en");
	const [theme, setTheme] = useState<Theme>("dark");
	const [loaded, setLoaded] = useState(false);
	useEffect(() => {
		if (controlled) {
			setLoaded(true);
			return;
		}
		try {
			const language = localStorage.getItem("assistant-locale");
			if (language === "es") setLocale(language);
			const saved = localStorage.getItem("assistant-theme");
			if (saved === "light" || saved === "dark" || saved === "system")
				setTheme(saved);
		} catch {}
		setLoaded(true);
	}, [controlled]);
	useEffect(() => {
		if (!loaded) return;
		document.documentElement.lang = controlled?.locale ?? locale;
		document.title = copy[controlled?.locale ?? locale].title;
		document
			.querySelector('meta[name="description"]')
			?.setAttribute("content", copy[controlled?.locale ?? locale].intro);
		try {
			if (!controlled) localStorage.setItem("assistant-locale", locale);
		} catch {}
	}, [locale, loaded, controlled]);
	useEffect(() => {
		if (!loaded) return;
		document.documentElement.dataset.theme = controlled?.theme ?? theme;
		try {
			if (!controlled) localStorage.setItem("assistant-theme", theme);
		} catch {}
	}, [theme, loaded, controlled]);
	return {
		locale: controlled?.locale ?? locale,
		setLocale,
		theme: controlled?.theme ?? theme,
		setTheme,
	};
}
