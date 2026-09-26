import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./style.css";
export const metadata: Metadata = {
	title: "Portfolio assistant",
	description: "Ask about Gonzalo Martin Perez's public work and projects.",
};
export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
