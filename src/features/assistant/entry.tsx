"use client";
import { useState } from "react";
import { createAssistant } from "./application/assistant";
import { createHttpTransport } from "./adapters/api";
import { useEmbed, type EmbedOptions } from "../embed/use-embed";
import Chat from "./presentation/chat";
export default function Assistant({ embed }: { embed?: EmbedOptions }) {
	const [assistant] = useState(() =>
		createAssistant(
			createHttpTransport(process.env.NEXT_PUBLIC_ASSISTANT_API_URL ?? ""),
			{ id: () => crypto.randomUUID(), now: () => new Date().toISOString() },
		),
	);
	const presentation = useEmbed(assistant, embed);
	return <Chat assistant={assistant} embed={presentation} />;
}
