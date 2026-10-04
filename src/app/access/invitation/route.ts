import { NextResponse } from "next/server";
import { readAuthConfiguration } from "../../../features/auth/config.ts";
export function GET(request: Request) {
	const token = new URL(request.url).searchParams.get("token");
	const configuration = readAuthConfiguration(process.env);
	const response = NextResponse.redirect(
		new URL("/sign-in", configuration.origin),
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
