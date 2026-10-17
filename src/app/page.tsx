import { FeedbackOverview } from "../features/operations/presentation/feedback";
import { loadProductAnalytics } from "../features/analytics/entry";
import { ProductOverview } from "../features/analytics/presentation/overview";
import { getAuthLocale, requireAccess } from "../features/auth/server";
import {
	loadOperations,
	loadFeedback,
	loadGrafanaDestination,
} from "../features/operations/entry";
import { Dashboard } from "../features/operations/presentation/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const access = await requireAccess();
	const params = await searchParams;
	const locale =
		params.locale === "es"
			? "es"
			: params.locale === "en"
				? "en"
				: await getAuthLocale();
	const [operations, product, feedback] = await Promise.all([
		loadOperations(),
		loadProductAnalytics(),
		loadFeedback(),
	]);
	return (
		<Dashboard
			result={operations}
			projectOverview={<ProductOverview result={product} locale={locale} />}
			assistantFeedback={<FeedbackOverview result={feedback} locale={locale} />}
			role={access.role}
			locale={locale}
			fixture={process.env.OPERATIONS_SOURCE_MODE === "fixture"}
			grafanaUrl={loadGrafanaDestination()}
		/>
	);
}
