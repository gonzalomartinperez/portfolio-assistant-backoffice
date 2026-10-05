import { NextResponse } from "next/server";
export function proxy() {
	const response = NextResponse.next();
	response.headers.set(
		"Content-Security-Policy",
		"frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
	);
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set("Cache-Control", "private, no-store");
	response.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=()",
	);
	return response;
}
export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
