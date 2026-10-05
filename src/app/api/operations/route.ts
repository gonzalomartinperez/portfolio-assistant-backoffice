import { getAccess } from "../../../features/auth/server";
import { loadOperations } from "../../../features/operations/entry";
export const dynamic = "force-dynamic";
export async function GET() {
	let access: Awaited<ReturnType<typeof getAccess>>;
	try {
		access = await getAccess();
	} catch {
		return Response.json(
			{ code: "unavailable" },
			{
				status: 503,
				headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
			},
		);
	}
	if (!access)
		return Response.json(
			{ code: "unauthorized" },
			{ status: 401, headers: { "Cache-Control": "private, no-store" } },
		);
	const result = await loadOperations();
	return Response.json(result, {
		status: result.kind === "available" ? 200 : 503,
		headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
	});
}
