import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { Pool } from "pg";
import { invitationToken, type AuthConfiguration } from "./config.ts";
import { createAccessStore } from "./store.ts";

export function createAuthRuntime(
	configuration: AuthConfiguration,
	pool = new Pool({
		connectionString: configuration.databaseUrl,
		max: 5,
		connectionTimeoutMillis: 5000,
		idleTimeoutMillis: 30000,
		statement_timeout: 5000,
	}),
) {
	pool.on("error", () =>
		console.error("Backoffice database connection interrupted."),
	);
	const store = createAccessStore(pool, configuration.ownerEmail);
	const options = {
		appName: "Portfolio Assistant Backoffice",
		baseURL: configuration.origin,
		secret: configuration.secret,
		trustedOrigins: [configuration.origin],
		database: pool,
		emailAndPassword: { enabled: false },
		socialProviders: {
			google: configuration.google,
			github: configuration.github,
		},
		account: {
			encryptOAuthTokens: true,
			accountLinking: { enabled: true, disableImplicitLinking: true },
		},
		session: {
			expiresIn: 28800,
			updateAge: 3600,
			cookieCache: { enabled: false },
		},
		advanced: {
			useSecureCookies: configuration.origin.startsWith("https:"),
			cookiePrefix: "backoffice",
			crossSubDomainCookies: { enabled: false },
		},
		telemetry: { enabled: false },
		logger: { disabled: true },
		rateLimit: {
			enabled: true,
			storage: "database" as const,
			window: 60,
			max: 30,
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user, context) => {
						if (
							!(await store.mayRegister(
								user.email,
								user.emailVerified,
								invitationToken(context?.headers),
							))
						)
							throw new APIError("FORBIDDEN", {
								message: "This account does not have an invitation.",
							});
					},
				},
			},
			session: {
				create: {
					before: async (session, context) => {
						if (
							!(await store.admit(
								session.userId,
								invitationToken(context?.headers),
							))
						)
							throw new APIError("FORBIDDEN", {
								message: "This account does not have access.",
							});
					},
				},
			},
		},
	} satisfies BetterAuthOptions;
	return { auth: betterAuth(options), pool, store, options };
}
