import { getAuthRuntime } from "../../../../features/auth/server.ts";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function handle(request: Request): Promise<Response> {
	try {
		const response = await getAuthRuntime().auth.handler(request);
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
