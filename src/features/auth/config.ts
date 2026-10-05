export interface AuthConfiguration {
	origin: string;
	databaseUrl: string;
	secret: string;
	ownerEmail: string;
	google: { clientId: string; clientSecret: string };
	github: { clientId: string; clientSecret: string };
}

export function readAuthConfiguration(
	env: NodeJS.ProcessEnv,
): AuthConfiguration {
	const required = (name: string): string => {
		const value = env[name]?.trim();
		if (!value)
			throw new Error(`Missing authentication configuration: ${name}`);
		return value;
	};
	const parseUrl = (value: string, name: string): URL => {
		try {
			return new URL(value);
		} catch {
			throw new Error(`Invalid ${name}`);
		}
	};
	const origin = parseUrl(required("BACKOFFICE_ORIGIN"), "BACKOFFICE_ORIGIN");
	if (
		origin.pathname !== "/" ||
		origin.search ||
		origin.hash ||
		origin.username ||
		origin.password ||
		!(
			origin.protocol === "https:" ||
			(origin.protocol === "http:" &&
				["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
		)
	) {
		throw new Error("Invalid BACKOFFICE_ORIGIN");
	}
	const databaseUrl = required("BACKOFFICE_DATABASE_URL");
	const database = parseUrl(databaseUrl, "BACKOFFICE_DATABASE_URL");
	if (!["postgres:", "postgresql:"].includes(database.protocol))
		throw new Error("Invalid BACKOFFICE_DATABASE_URL");
	const secret = required("BETTER_AUTH_SECRET");
	if (secret.length < 32)
		throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
	const ownerEmail = required("BACKOFFICE_OWNER_EMAIL").toLowerCase();
	if (!validEmail(ownerEmail))
		throw new Error("Invalid BACKOFFICE_OWNER_EMAIL");
	return {
		origin: origin.origin,
		databaseUrl,
		secret,
		ownerEmail,
		google: {
			clientId: required("GOOGLE_CLIENT_ID"),
			clientSecret: required("GOOGLE_CLIENT_SECRET"),
		},
		github: {
			clientId: required("GITHUB_CLIENT_ID"),
			clientSecret: required("GITHUB_CLIENT_SECRET"),
		},
	};
}

export function validEmail(value: string): boolean {
	return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function invitationToken(headers: Headers | undefined): string | null {
	const value = headers
		?.get("cookie")
		?.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith("backoffice-invitation="))
		?.slice("backoffice-invitation=".length);
	return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
