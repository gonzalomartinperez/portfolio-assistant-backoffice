"use client";
import { useEffect, useState } from "react";
import { copy, type Locale } from "../i18n/copy";
export type Theme = "dark" | "light" | "system";
export function usePreferences() {
	const [locale, setLocale] = useState<Locale>("en");
	const [theme, setTheme] = useState<Theme>("dark");
	const [loaded, setLoaded] = useState(false);
	useEffect(() => {
		try {
			const language = localStorage.getItem("assistant-locale");
			if (language === "es") setLocale(language);
			const saved = localStorage.getItem("assistant-theme");
			if (saved === "light" || saved === "dark" || saved === "system")
				setTheme(saved);
		} catch {}
		setLoaded(true);
	}, []);
	useEffect(() => {
		if (!loaded) return;
		document.documentElement.lang = locale;
		document.title = copy[locale].title;
		document
			.querySelector('meta[name="description"]')
			?.setAttribute("content", copy[locale].intro);
		try {
			localStorage.setItem("assistant-locale", locale);
		} catch {}
	}, [locale, loaded]);
	useEffect(() => {
		if (!loaded) return;
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem("assistant-theme", theme);
		} catch {}
	}, [theme, loaded]);
	return { locale, setLocale, theme, setTheme };
}
