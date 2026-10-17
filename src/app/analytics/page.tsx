import { requireAccess, getAuthLocale } from "../../features/auth/server";
import { loadProductAnalytics } from "../../features/analytics/entry";
import { ProductMetrics } from "../../features/analytics/presentation/metrics";
import { productCopy } from "../../features/analytics/presentation/copy";
import { Preferences } from "../../features/operations/presentation/preferences";
import { ButtonLink } from "../../components/ui/button-link";
export const dynamic = "force-dynamic";
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	await requireAccess();
	const params = await searchParams;
	const locale =
		params.locale === "es"
			? "es"
			: params.locale === "en"
				? "en"
				: await getAuthLocale();
	const result = await loadProductAnalytics();
	const t = productCopy[locale];
	return (
		<main id="main" lang={locale} className="operations-shell">
			<header className="operations-header">
				<div>
					<p className="eyebrow">GMP / Backoffice</p>
					<h1>{t.title}</h1>
					<p>{t.description}</p>
				</div>
				<nav aria-label={t.back}>
					<ButtonLink href={`/?locale=${locale}`}>{t.back}</ButtonLink>
					<ButtonLink href={`/privacy?locale=${locale}`}>
						{t.privacy}
					</ButtonLink>
					<Preferences locale={locale} />
				</nav>
			</header>
			{process.env.OPERATIONS_SOURCE_MODE === "fixture" && (
				<p className="operational-notice">{t.fixture}</p>
			)}
			<p>{t.scope}</p>
			{result.kind === "available" ? (
				<ProductMetrics snapshot={result.snapshot} locale={locale} />
			) : (
				<section className="operational-notice">
					<h2>{result.kind === "disabled" ? t.disabled : t.unavailable}</h2>
					<p>
						{result.kind === "disabled" ? t.disabledBody : t.unavailableBody}
					</p>
				</section>
			)}
		</main>
	);
}
