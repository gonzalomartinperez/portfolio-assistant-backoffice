import type { ProductRead } from "../domain/models";
import { ButtonLink } from "../../../components/ui/button-link";
import { productCopy } from "./copy";
import styles from "./metrics.module.css";
const en = {
	title: "Website interactions",
	body: "Seven UTC days of accepted events, without visitor journeys or conversation text.",
	open: "Explore website data",
	disabled:
		"The private product-data view is off. Public collection requires separate activation.",
	unavailable:
		"The product source is unavailable. Missing observations are not zero.",
};
const es: typeof en = {
	title: "Interacciones del sitio",
	body: "Siete días UTC de eventos aceptados, sin recorridos de visitantes ni conversaciones.",
	open: "Explorar datos del sitio",
	disabled:
		"La vista privada de datos de producto está apagada. La recolección pública requiere una activación independiente.",
	unavailable:
		"La fuente de producto no está disponible. La falta de observaciones no equivale a cero.",
};
export function ProductOverview({
	result,
	locale,
}: {
	result: ProductRead;
	locale: "en" | "es";
}) {
	const t = locale === "es" ? es : en;
	const labels = productCopy[locale];
	const format = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US");
	return (
		<section
			className="operation-card"
			aria-labelledby="website-overview-title"
		>
			<h2 id="website-overview-title">{t.title}</h2>
			<p>{t.body}</p>
			{result.kind === "available" ? (
				<dl className={styles.summary}>
					{(["page_view", "cv_link_open", "contact_link_open"] as const).map(
						(name) => (
							<div key={name}>
								<dt>{labels.events[name]}</dt>
								<dd>
									{format.format(
										result.snapshot.counts
											.filter((row) => row.eventName === name)
											.reduce((sum, row) => sum + row.count, 0),
									)}
								</dd>
							</div>
						),
					)}
				</dl>
			) : (
				<p>{result.kind === "disabled" ? t.disabled : t.unavailable}</p>
			)}
			<ButtonLink href={`/analytics?locale=${locale}`}>{t.open}</ButtonLink>
		</section>
	);
}
