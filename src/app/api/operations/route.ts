import { getAccess } from "../../../features/auth/server";
import { loadOperations } from "../../../features/operations/entry";
export async function GET() {
	const access = await getAccess();
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
