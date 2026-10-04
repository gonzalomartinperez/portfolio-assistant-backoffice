import { getAuthRuntime } from "../../../../features/auth/server.ts";
import { callbackResponse } from "../../../../features/auth/callback-response.ts";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function handle(request: Request): Promise<Response> {
	try {
		const runtime = getAuthRuntime();
		const response = callbackResponse(
			request,
			await runtime.auth.handler(request),
			runtime.options.baseURL,
		);
		response.headers.set("Cache-Control", "private, no-store");
		return response;
	} catch {
		return Response.json(
			{ error: "Authentication is temporarily unavailable." },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	}
}
export const GET = handle;
export const POST = handle;
