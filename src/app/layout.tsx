import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontClassName } from "./fonts";
import { SkipLink } from "../shared/accessibility/skip-link";
import "./style.css";
export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
};
export const metadata: Metadata = {
	title: "GMP · Assistant backoffice",
	description: "Authenticated operations for Gonzalo’s portfolio assistant.",
	robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={fontClassName} suppressHydrationWarning>
			<head>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: fixed pre-paint theme replay, no user HTML.
					dangerouslySetInnerHTML={{
						__html:
							'if(location.pathname==="/embed"){var q=new URLSearchParams(location.search);document.documentElement.dataset.theme=q.get("theme")==="light"?"light":"dark"}else try{var t=localStorage.getItem("assistant-theme");document.documentElement.dataset.theme=t==="light"||t==="system"||t==="dark"?t:"dark"}catch(e){document.documentElement.dataset.theme="dark"}',
					}}
				/>
			</head>
			<body>
				<SkipLink />
				{children}
			</body>
		</html>
	);
}
