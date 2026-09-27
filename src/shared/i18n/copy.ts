export type Locale = "en" | "es";

const translations = {
	en: {
		expired: "Your session has expired. Reconnect to start a new session.",
		rejected:
			"The request could not be accepted. Check your question or reconnect.",
		jump: "Jump to latest",
		initializing: "Connecting to the assistant…",
		completed: "Answer complete. Review its sources and limitations.",
		cancelled: "Response stopped. Partial text may not be saved.",
		historyLoading: "Loading saved messages…",
		skip: "Skip to question",
		partial: "Incomplete response",
		retentionInfo:
			"History is stored by the service for {days} days, linked to this browser’s anonymous session.",
		brand: "GMP / Assistant",
		collection: "PUBLIC WORK · AI ASSISTANT",
		subtitle: "Explore projects, experience, and how this portfolio was built.",
		title: "Ask about Gonzalo's work",
		intro:
			"An AI assistant about Gonzalo’s public work. Sources provide context; answers can still be incomplete.",
		new: "New chat",
		untitled: "New conversation",
		menu: "Conversations",
		close: "Close conversations",
		closeBackdrop: "Dismiss conversation menu overlay",
		emptyTitle: "Where would you like to start?",
		empty:
			"Projects, experience, education. Choose a starting point, then make the question your own.",
		examples: [
			"What is Filomena?",
			"What did Gonzalo do at Rampy?",
			"Where did Gonzalo study?",
		],
		send: "Send",
		stop: "Stop",
		delete: "Delete",
		rename: "Rename",
		confirmDelete: "Delete this conversation?",
		confirm: "Delete conversation",
		cancel: "Cancel",
		save: "Save",
		sources: "Public sources",
		code: "CODE",
		document: "DOC",
		feedback: "Rate this answer",
		unavailable:
			"The assistant is unavailable. Try checking your connection and reconnecting.",
		interrupted:
			"The connection ended early. Review the saved conversation before sending again.",
		prompt: "Ask a question about public work",
		theme: "Theme",
		language: "Language",
		system: "System",
		light: "Light",
		dark: "Dark",
		you: "You",
		assistant: "Assistant",
		copyAnswer: "Copy answer",
		copying: "Copying…",
		copied: "Copied",
		copyFailed: "Could not copy. Select the answer text to copy it manually.",
		explore: "Explore next",
		followups: [
			"How was this portfolio built?",
			"What other projects can I explore?",
		],
		up: "Helpful",
		down: "Not helpful",
		thanks: "Feedback saved",
		retry: "Check saved conversation",
		reconnect: "Reconnect",
		composerNote:
			"Enter to send · Shift+Enter for a new line · Public questions only",
		thinking: "Waiting for a response…",
		noConversations: "Your conversations will appear here.",
	},
	es: {
		expired:
			"Tu sesión venció. Vuelve a conectarte para iniciar una sesión nueva.",
		rejected:
			"No se pudo aceptar la solicitud. Revisa tu pregunta o vuelve a conectarte.",
		jump: "Ir al último mensaje",
		initializing: "Conectando con el asistente…",
		completed: "Respuesta completa. Revisa sus fuentes y limitaciones.",
		cancelled: "Respuesta detenida. El texto parcial puede no estar guardado.",
		historyLoading: "Cargando mensajes guardados…",
		skip: "Ir a la pregunta",
		partial: "Respuesta incompleta",
		retentionInfo:
			"El servicio guarda el historial durante {days} días, asociado a la sesión anónima de este navegador.",
		brand: "GMP / Asistente",
		collection: "TRABAJO PÚBLICO · ASISTENTE DE IA",
		subtitle:
			"Explora proyectos, experiencia y cómo se construyó este portafolio.",
		title: "Pregunta por el trabajo de Gonzalo",
		intro:
			"Un asistente de IA sobre el trabajo público de Gonzalo. Las fuentes dan contexto; las respuestas pueden ser incompletas.",
		new: "Nueva conversación",
		untitled: "Nueva conversación",
		menu: "Conversaciones",
		close: "Cerrar conversaciones",
		closeBackdrop: "Cerrar el menú de conversaciones",
		emptyTitle: "¿Por dónde quieres empezar?",
		empty:
			"Proyectos, experiencia y formación. Elige un punto de partida y adapta la pregunta.",
		examples: [
			"¿Qué es Filomena?",
			"¿Qué hizo Gonzalo en Rampy?",
			"¿Dónde estudió Gonzalo?",
		],
		send: "Enviar",
		stop: "Detener",
		delete: "Eliminar",
		rename: "Cambiar nombre",
		confirmDelete: "¿Eliminar esta conversación?",
		confirm: "Eliminar conversación",
		cancel: "Cancelar",
		save: "Guardar",
		sources: "Fuentes públicas",
		code: "CÓDIGO",
		document: "DOC",
		feedback: "Califica esta respuesta",
		unavailable:
			"El asistente no está disponible. Revisa tu conexión e intenta conectarte de nuevo.",
		interrupted:
			"La conexión se interrumpió. Revisa la conversación guardada antes de volver a enviar.",
		prompt: "Pregunta por el trabajo público",
		theme: "Tema",
		language: "Idioma",
		system: "Sistema",
		light: "Claro",
		dark: "Oscuro",
		you: "Tú",
		assistant: "Asistente",
		copyAnswer: "Copiar respuesta",
		copying: "Copiando…",
		copied: "Copiada",
		copyFailed:
			"No se pudo copiar. Selecciona el texto de la respuesta para copiarlo manualmente.",
		explore: "Sigue explorando",
		followups: [
			"¿Cómo se construyó este portafolio?",
			"¿Qué otros proyectos puedo explorar?",
		],
		up: "Útil",
		down: "No útil",
		thanks: "Opinión guardada",
		retry: "Revisar conversación guardada",
		reconnect: "Volver a conectarme",
		composerNote:
			"Enter para enviar · Mayús+Enter para una línea nueva · Solo preguntas públicas",
		thinking: "Esperando una respuesta…",
		noConversations: "Tus conversaciones aparecerán aquí.",
	},
} as const;

type Dictionary = {
	[Key in keyof typeof translations.en]: (typeof translations.en)[Key] extends readonly string[]
		? readonly string[]
		: string;
};
export const copy: Record<Locale, Dictionary> = translations;
export function retentionText(locale: Locale, days: number): string {
	return copy[locale].retentionInfo.replace("{days}", String(days));
}
