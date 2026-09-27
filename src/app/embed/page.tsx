import Assistant from "../../features/assistant/entry";
import { parseEmbedOrigins } from "../../shared/config/embed-origins";
export const metadata = { robots: { index: false, follow: false } };
export default async function EmbedPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const query = await searchParams;
	return (
		<Assistant
			embed={{
				allowedOrigins: parseEmbedOrigins(process.env.EMBED_ALLOWED_ORIGINS),
				initialPreferences: {
					locale: query.locale === "es" ? "es" : "en",
					theme: query.theme === "light" ? "light" : "dark",
				},
			}}
		/>
	);
}
