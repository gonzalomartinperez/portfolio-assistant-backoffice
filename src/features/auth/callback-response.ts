import { authLocale } from "./copy.ts";

export function callbackResponse(
	request: Request,
	response: Response,
	origin: string,
): Response {
	const path = new URL(request.url).pathname;
	if (
		request.method !== "GET" ||
		!/^\/api\/auth\/callback\/(google|github)$/.test(path) ||
		![400, 403].includes(response.status)
	)
		return response;
	const localeCookie = request.headers
		.get("cookie")
		?.split(";")
		.map((value) => value.trim())
		.find((value) => value.startsWith("backoffice-locale="))
		?.slice("backoffice-locale=".length);
	const destination = new URL("/sign-in", origin);
	destination.searchParams.set("error", "access");
	destination.searchParams.set("locale", authLocale(localeCookie));
	return new Response(null, {
		status: 303,
		headers: {
			Location: destination.href,
			"Cache-Control": "private, no-store",
			"Referrer-Policy": "no-referrer",
		},
	});
}
