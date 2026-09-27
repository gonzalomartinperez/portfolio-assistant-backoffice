import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";

const sans = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans",
});
const display = Inter_Tight({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-display",
});
const mono = JetBrains_Mono({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-mono",
});

export const fontClassName = `${sans.variable} ${display.variable} ${mono.variable}`;
