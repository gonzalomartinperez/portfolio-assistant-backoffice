export function validateGrafanaDestination(
	value: string | undefined,
): string | null {
	if (
		!value ||
		value.length > 2048 ||
		Array.from(value).some((character) => character.charCodeAt(0) <= 32)
	)
		return null;
	try {
		const url = new URL(value);
		const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
		if (
			(url.protocol !== "https:" && !(loopback && url.protocol === "http:")) ||
			url.username ||
			url.password ||
			url.search ||
			url.hash ||
			!/^\/d\/[A-Za-z0-9_-]{1,64}\/[A-Za-z0-9_-]{1,128}\/?$/.test(url.pathname)
		)
			return null;
		return url.href;
	} catch {
		return null;
	}
}
