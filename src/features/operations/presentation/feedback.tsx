import { helpfulShare, type FeedbackRead } from "../domain/feedback";
const en = {
	title: "Answer feedback",
	body: "Current ratings on retained answers created in the last seven days. Votes can change; deleted answers disappear.",
	helpful: "Helpful",
	unhelpful: "Not helpful",
	share: "Share among current ratings",
	scope:
		"Visitor opinions, not a measure of verified accuracy. No automatic training.",
	disabled: "The private feedback summary is off.",
	unavailable: "Feedback is unavailable; missing data is not zero.",
	empty: "No current ratings in this window.",
	observed: "Observed (UTC)",
};
const es: typeof en = {
	title: "Opiniones sobre las respuestas",
	body: "Votos actuales de respuestas retenidas creadas en los últimos siete días. Los votos pueden cambiar; las respuestas eliminadas dejan de contarse.",
	helpful: "Útil",
	unhelpful: "Poco útil",
	share: "Proporción entre los votos actuales",
	scope:
		"Opiniones de visitantes, no una medida de exactitud verificada. No hay entrenamiento automático.",
	disabled: "El resumen privado de opiniones está apagado.",
	unavailable:
		"Las opiniones no están disponibles; la falta de datos no equivale a cero.",
	empty: "No hay votos actuales en este período.",
	observed: "Consulta (UTC)",
};
export function FeedbackOverview({
	result,
	locale,
}: {
	result: FeedbackRead;
	locale: "en" | "es";
}) {
	const t = locale === "es" ? es : en;
	const snapshot = result.kind === "available" ? result.snapshot : null;
	const share = snapshot ? helpfulShare(snapshot) : null;
	const format = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US");
	const percent = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
		style: "percent",
		maximumFractionDigits: 1,
	});
	return (
		<section className="operation-card" aria-labelledby="feedback-title">
			<h2 id="feedback-title">{t.title}</h2>
			<p>{t.body}</p>
			{snapshot ? (
				<>
					<dl>
						<dt>{t.helpful}</dt>
						<dd>{format.format(snapshot.up)}</dd>
						<dt>{t.unhelpful}</dt>
						<dd>{format.format(snapshot.down)}</dd>
					</dl>
					{share === null ? (
						<p>{t.empty}</p>
					) : (
						<p>
							{t.share}: <strong>{percent.format(share)}</strong>
						</p>
					)}
					<p>
						{t.observed}:{" "}
						<time dateTime={snapshot.observedAt}>
							{new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
								dateStyle: "medium",
								timeStyle: "short",
								timeZone: "UTC",
							}).format(new Date(snapshot.observedAt))}
						</time>
					</p>
				</>
			) : (
				<p>{result.kind === "disabled" ? t.disabled : t.unavailable}</p>
			)}
			<p>{t.scope}</p>
		</section>
	);
}
