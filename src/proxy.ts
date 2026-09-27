import { NextResponse, type NextRequest } from "next/server";
import { parseEmbedOrigins } from "./shared/config/embed-origins";
export function proxy(request: NextRequest) {
	const response = NextResponse.next();
	if (request.nextUrl.pathname === "/embed") {
		response.headers.set(
			"Content-Security-Policy",
			`frame-ancestors ${parseEmbedOrigins(process.env.EMBED_ALLOWED_ORIGINS).join(" ")}`,
		);
		response.headers.set("Cache-Control", "private, no-store");
	} else {
		response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
		response.headers.set("X-Frame-Options", "DENY");
	}
	return response;
}
export const config = { matcher: ["/", "/embed"] };
