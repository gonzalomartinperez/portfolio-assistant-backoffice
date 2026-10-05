export function GET() {
	return Response.json(
		{ status: "alive", application: "portfolio-assistant-backoffice" },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
