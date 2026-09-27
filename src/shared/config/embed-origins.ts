export function parseEmbedOrigins(value: string | undefined): string[] {
	const origins = (value ?? "https://gonzalomartinperez.com").split(",");
	if (origins.length > 8) throw new Error("Invalid EMBED_ALLOWED_ORIGINS");
	return [
		...new Set(
			origins.map((entry) => {
				const origin = entry.trim();
				let url: URL;
				try {
					url = new URL(origin);
				} catch {
					throw new Error("Invalid EMBED_ALLOWED_ORIGINS");
				}
				if (
					origin.includes("*") ||
					url.origin !== origin ||
					url.username ||
					url.password ||
					(url.protocol !== "https:" &&
						!(
							url.protocol === "http:" &&
							["localhost", "127.0.0.1"].includes(url.hostname)
						))
				) {
					throw new Error("Invalid EMBED_ALLOWED_ORIGINS");
				}
				return origin;
			}),
		),
	];
}
