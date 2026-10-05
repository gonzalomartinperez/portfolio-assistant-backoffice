import { authLocale } from "../../../features/auth/copy.ts";
import { NextResponse } from "next/server";
import { readAuthConfiguration } from "../../../features/auth/config.ts";
export function GET(request: Request) {
	const token = new URL(request.url).searchParams.get("token");
	let configuration: ReturnType<typeof readAuthConfiguration>;
	try {
		configuration = readAuthConfiguration(process.env);
	} catch {
		return new Response("Authentication is temporarily unavailable.", {
			status: 503,
			headers: {
				"Cache-Control": "no-store",
				"Referrer-Policy": "no-referrer",
			},
		});
	}
	const response = NextResponse.redirect(
		new URL(
			`/sign-in?locale=${authLocale(new URL(request.url).searchParams.get("locale"))}`,
			configuration.origin,
		),
	);
	response.headers.set("Cache-Control", "no-store");
	response.headers.set("Referrer-Policy", "no-referrer");
	if (token && /^[a-f0-9]{64}$/.test(token))
		response.cookies.set("backoffice-invitation", token, {
			httpOnly: true,
			secure: configuration.origin.startsWith("https:"),
			sameSite: "lax",
			path: "/",
			maxAge: 172800,
		});
	return response;
}
