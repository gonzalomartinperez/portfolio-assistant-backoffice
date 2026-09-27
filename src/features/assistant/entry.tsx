"use client";
import { useState } from "react";
import { createAssistant } from "./application/assistant";
import { createHttpTransport } from "./adapters/api";
import Chat from "./presentation/chat";
export default function Assistant() {
	const [assistant] = useState(() =>
		createAssistant(
			createHttpTransport(process.env.NEXT_PUBLIC_ASSISTANT_API_URL ?? ""),
			{ id: () => crypto.randomUUID(), now: () => new Date().toISOString() },
		),
	);
	return <Chat assistant={assistant} />;
}
