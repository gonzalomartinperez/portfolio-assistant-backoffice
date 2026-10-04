import { requireAccess } from "../features/auth/server";
import { loadOperations } from "../features/operations/entry";
import { Dashboard } from "../features/operations/presentation/dashboard";
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const access = await requireAccess();
	const params = await searchParams;
	return (
		<Dashboard
			result={await loadOperations()}
			role={access.role}
			locale={params.locale === "es" ? "es" : "en"}
			fixture={process.env.OPERATIONS_SOURCE_MODE === "fixture"}
		/>
	);
}
