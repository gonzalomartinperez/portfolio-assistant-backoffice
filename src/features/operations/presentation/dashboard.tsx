import type { OperationalRead } from "../domain/models";
import { operationsCopy, type OperationsLocale } from "./copy";
import { Preferences } from "./preferences";
import { SignOut } from "../../auth/sign-out";
function Timestamp({ value }: { value: string }) {
	return (
		<time dateTime={value}>
			{value.replace("T", " ").replace(/\.\d+Z$/, " UTC")}
		</time>
	);
}
export function Dashboard({
	result,
	role,
	locale,
	fixture,
}: {
	result: OperationalRead;
	role: "owner" | "viewer";
	locale: OperationsLocale;
	fixture: boolean;
}) {
	const t = operationsCopy[locale];
	const snapshot = result.kind === "available" ? result.snapshot : null;
	const format = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US");
	const money = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 4,
	});
	return (
		<main id="main" className="operations-shell" lang={locale}>
			<header className="operations-header">
				<div>
					<p className="eyebrow">GMP / Backoffice</p>
					<h1>{t.title}</h1>
					<p>{t.description}</p>
				</div>
				<nav aria-label={locale === "es" ? "Cuenta" : "Account"}>
					{role === "owner" && (
						<a href={`/access?locale=${locale}`}>{t.access}</a>
					)}
					<Preferences locale={locale} />
					<SignOut label={t.signOut} />
				</nav>
			</header>
			<div className="operations-toolbar">
				<p>
					{t.checked}: <Timestamp value={result.checkedAt} />
				</p>
				<form method="get">
					<input type="hidden" name="locale" value={locale} />
					<button type="submit">{t.refresh}</button>
				</form>
			</div>
			{fixture && <p className="operational-notice">{t.fixture}</p>}
			{!snapshot && (
				<section className="operational-notice">
					<h2>
						{result.kind === "unconfigured"
							? t.pendingTitle
							: t.unavailableTitle}
					</h2>
					<p>
						{result.kind === "unconfigured" ? t.pendingBody : t.unavailableBody}
					</p>
				</section>
			)}
			<div className="operations-grid">
				<section className="operation-card">
					<h2>{t.status}</h2>
					<p className="metric">
						{snapshot ? t[snapshot.availability] : t.notAvailable}
					</p>
					{snapshot && (
						<>
							<p>
								{t.observed}: <Timestamp value={snapshot.observedAt} />
							</p>
							<p>
								API <code>{snapshot.apiCommit.slice(0, 12)}</code>
							</p>
						</>
					)}
				</section>
				<section className="operation-card">
					<h2>{t.knowledge}</h2>
					<p className="metric">
						{snapshot ? t[snapshot.knowledge.state] : t.notAvailable}
					</p>
					{snapshot && (
						<dl>
							<dt>{t.source}</dt>
							<dd>
								<code>{snapshot.knowledge.sourceCommit.slice(0, 12)}</code>
							</dd>
							<dt>{t.corpus}</dt>
							<dd>{snapshot.knowledge.corpusVersion}</dd>
							<dt>{t.indexed}</dt>
							<dd>
								<Timestamp value={snapshot.knowledge.indexedAt} />
							</dd>
						</dl>
					)}
				</section>
				<section className="operation-card">
					<h2>{t.executions}</h2>
					<p className="metric">
						{snapshot ? format.format(snapshot.executions.total) : "—"}
					</p>
					{snapshot && (
						<dl>
							<dt>{t.completed}</dt>
							<dd>{format.format(snapshot.executions.completed)}</dd>
							<dt>{t.cancelled}</dt>
							<dd>{format.format(snapshot.executions.cancelled)}</dd>
							<dt>{t.failed}</dt>
							<dd>{format.format(snapshot.executions.failed)}</dd>
							<dt>{t.firstToken}</dt>
							<dd>
								{snapshot.executions.firstTokenP95Ms === null
									? t.notAvailable
									: `${format.format(snapshot.executions.firstTokenP95Ms)} ms`}
							</dd>
						</dl>
					)}
				</section>
				<section className="operation-card">
					<h2>{t.usage}</h2>
					<p className="metric">
						{snapshot ? money.format(snapshot.usage.settledUsd) : "—"}
					</p>
					{snapshot && (
						<dl>
							<dt>{t.reserve}</dt>
							<dd>{money.format(snapshot.usage.reservedUsd)}</dd>
							<dt>{t.budget}</dt>
							<dd>{money.format(snapshot.usage.budgetUsd)}</dd>
							<dt>{t.input}</dt>
							<dd>{format.format(snapshot.usage.inputTokens)}</dd>
							<dt>{t.output}</dt>
							<dd>{format.format(snapshot.usage.outputTokens)}</dd>
						</dl>
					)}
					<p>{t.pricing}</p>
				</section>
			</div>
			<section className="operation-card trace-section">
				<h2>{t.traces}</h2>
				{!snapshot || snapshot.traces.length === 0 ? (
					<p>{t.emptyTraces}</p>
				) : (
					<ul className="trace-list">
						{snapshot.traces.map((trace) => (
							<li key={trace.id}>
								<details>
									<summary>
										<span>
											<code>{trace.id.slice(0, 12)}</code> · {t[trace.outcome]}
										</span>
										<span>{format.format(trace.durationMs)} ms</span>
									</summary>
									<p>
										<Timestamp value={trace.startedAt} />
									</p>
									<ol>
										{trace.stages.map((stage, index) => (
											<li key={`${stage.name}-${index}`}>
												<span>
													{stage.name === "language"
														? t.languageStage
														: t[stage.name]}
												</span>
												<span>{format.format(stage.durationMs)} ms</span>
											</li>
										))}
									</ol>
								</details>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}
