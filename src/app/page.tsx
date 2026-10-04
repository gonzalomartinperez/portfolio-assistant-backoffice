import { getAuthLocale, requireAccess } from "../features/auth/server";
import { loadOperations } from "../features/operations/entry";
import { Dashboard } from "../features/operations/presentation/dashboard";
export const dynamic = "force-dynamic";
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
			locale={
				params.locale === "es"
					? "es"
					: params.locale === "en"
						? "en"
						: await getAuthLocale()
			}
			fixture={process.env.OPERATIONS_SOURCE_MODE === "fixture"}
		/>
	);
}
