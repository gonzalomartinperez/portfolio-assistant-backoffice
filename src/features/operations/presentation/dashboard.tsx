import type { ReactNode } from "react";
import type { OperationalRead } from "../domain/models";
import { summarizeOperations } from "../domain/insights";
import { operationsCopy, type OperationsLocale } from "./copy";
import { SnapshotChart } from "./charts";
import { TraceExplorer } from "./trace-explorer";
import { Preferences } from "./preferences";
import { SignOut } from "../../auth/sign-out";
import { Button } from "../../../components/ui/button";
import { ButtonLink } from "../../../components/ui/button-link";
import styles from "./workbench.module.css";

function Timestamp({ value }: { value: string }) {
	return (
		<time dateTime={value}>
			{value.replace("T", " ").replace(/(?:\.\d+)?Z$/, " UTC")}
		</time>
	);
}

export function Dashboard({
	result,
	role,
	locale,
	fixture,
	grafanaUrl,
	projectOverview,
}: {
	result: OperationalRead;
	role: "owner" | "viewer";
	locale: OperationsLocale;
	fixture: boolean;
	grafanaUrl: string | null;
	projectOverview: ReactNode;
}) {
	const t = operationsCopy[locale];
	const snapshot = result.kind === "available" ? result.snapshot : null;
	const insights = snapshot ? summarizeOperations(snapshot) : null;
	const language = locale === "es" ? "es-AR" : "en-US";
	const format = new Intl.NumberFormat(language);
	const money = new Intl.NumberFormat(language, {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 4,
	});
	const percent = new Intl.NumberFormat(language, {
		style: "percent",
		maximumFractionDigits: 1,
	});
	const fill =
		insights?.budgetShare === null || !insights
			? 0
			: Math.min(100, Math.max(0, insights.budgetShare * 100));
	return (
		<main
			id="main"
			className={`operations-shell ${styles.shell}`}
			lang={locale}
		>
			<header className={`operations-header ${styles.header}`}>
				<div className={styles.identity}>
					<span className={styles.brandMark} aria-hidden="true">
						G
					</span>
					<div>
						<p className="eyebrow">GMP / Backoffice</p>
						<h1>{t.title}</h1>
						<p>{t.description}</p>
					</div>
				</div>
				<nav aria-label={t.account}>
					<ButtonLink href={`/analytics?locale=${locale}`}>
						{locale === "es" ? "Interacciones" : "Interactions"}
					</ButtonLink>
					{role === "owner" && (
						<ButtonLink href={`/access?locale=${locale}`}>
							{t.access}
						</ButtonLink>
					)}
					<Preferences locale={locale} />
					<SignOut label={t.signOut} locale={locale} />
				</nav>
			</header>
			<div className={`operations-toolbar ${styles.toolbar}`}>
				<div className={styles.sectionNav}>
					<a href="#overview">{t.overview}</a>
					<a href="#execution-details">{t.traces}</a>
				</div>
				<div className={styles.refreshGroup}>
					<p>
						{t.checked}: <Timestamp value={result.checkedAt} />
					</p>
					<form method="get">
						<input type="hidden" name="locale" value={locale} />
						<Button type="submit">{t.refresh}</Button>
					</form>
				</div>
			</div>
			{fixture && (
				<p className={`operational-notice ${styles.fixtureNotice}`}>
					{t.fixture}
				</p>
			)}
			{projectOverview}
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
			<div id="overview" tabIndex={-1} className={styles.overviewGrid}>
				<div className={`operations-grid ${styles.metricsGrid}`}>
					<section className={`operation-card ${styles.metricCard}`}>
						<div className={styles.cardHeading}>
							<h2>{t.status}</h2>
							<span
								className={styles.signalDot}
								data-state={snapshot?.availability ?? "unknown"}
								aria-hidden="true"
							/>
						</div>
						<p className={`metric ${styles.value}`}>
							{snapshot ? t[snapshot.availability] : t.notAvailable}
						</p>
						<p className={styles.caption}>{t.serviceScope}</p>
						{snapshot && (
							<p className={styles.cardFoot}>
								{t.observed}: <Timestamp value={snapshot.observedAt} />
							</p>
						)}
					</section>
					<section className={`operation-card ${styles.metricCard}`}>
						<div className={styles.cardHeading}>
							<h2>{t.knowledge}</h2>
							<span
								className={styles.signalDot}
								data-state={snapshot?.knowledge.state ?? "unknown"}
								aria-hidden="true"
							/>
						</div>
						<p className={`metric ${styles.value}`}>
							{snapshot ? t[snapshot.knowledge.state] : t.notAvailable}
						</p>
						{snapshot && (
							<>
								<p className={styles.caption}>
									{t.source}
									<br />
									<code>{snapshot.knowledge.sourceCommit.slice(0, 12)}</code>
								</p>
								<p className={styles.cardFoot}>
									{t.indexed}:{" "}
									<Timestamp value={snapshot.knowledge.indexedAt} />
								</p>
								<p className={styles.cardFoot}>
									{t.corpus}: <code>{snapshot.knowledge.corpusVersion}</code>
								</p>
							</>
						)}
					</section>
					<section className={`operation-card ${styles.metricCard}`}>
						<div className={styles.cardHeading}>
							<h2>{t.executions}</h2>
							<span className={styles.cardLabel}>{t.executionWindow}</span>
						</div>
						<p className={`metric ${styles.value}`}>
							{snapshot ? format.format(snapshot.executions.total) : "—"}
						</p>
						{snapshot && insights && (
							<dl>
								<dt>{t.completed}</dt>
								<dd>{format.format(snapshot.executions.completed)}</dd>
								<dt>{t.completionShare}</dt>
								<dd>
									{insights.completionShare === null
										? t.notAvailable
										: percent.format(insights.completionShare)}
								</dd>
							</dl>
						)}
					</section>
					<section className={`operation-card ${styles.metricCard}`}>
						<div className={styles.cardHeading}>
							<h2>{t.usage}</h2>
							<span className={styles.cardLabel}>{t.usageWindow}</span>
						</div>
						<p className={`metric ${styles.value}`}>
							{snapshot ? money.format(snapshot.usage.settledUsd) : "—"}
						</p>
						{snapshot && (
							<dl>
								<dt>{t.reserve}</dt>
								<dd>{money.format(snapshot.usage.reservedUsd)}</dd>
								<dt>{t.budget}</dt>
								<dd>{money.format(snapshot.usage.budgetUsd)}</dd>
							</dl>
						)}
					</section>
				</div>
				{snapshot && (
					<SnapshotChart
						executions={snapshot.executions}
						usage={snapshot.usage}
						locale={locale}
					/>
				)}
			</div>
			<div className={styles.detailGrid}>
				<section
					id="execution-details"
					tabIndex={-1}
					className={`operation-card trace-section ${styles.tracePanel}`}
				>
					<div className={styles.panelHeading}>
						<div>
							<p className="eyebrow">{t.firstOutput}</p>
							<h2>{t.traces}</h2>
						</div>
						{grafanaUrl && (
							<ButtonLink
								href={grafanaUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								{t.grafana}
								<span aria-hidden="true">↗</span>
							</ButtonLink>
						)}
					</div>
					<dl className={styles.latencyStats}>
						<div>
							<dt>{t.median}</dt>
							<dd>
								{snapshot?.executions.firstTokenP50Ms === null || !snapshot
									? t.notAvailable
									: `${format.format(snapshot.executions.firstTokenP50Ms)} ms`}
							</dd>
						</div>
						<div>
							<dt>{t.tail}</dt>
							<dd>
								{snapshot?.executions.firstTokenP95Ms === null || !snapshot
									? t.notAvailable
									: `${format.format(snapshot.executions.firstTokenP95Ms)} ms`}
							</dd>
						</div>
					</dl>
					<p className={styles.caption}>{t.latencyContext}</p>
					<p className={styles.caption}>{t.traceContext}</p>
					<TraceExplorer traces={snapshot?.traces ?? []} locale={locale} />
				</section>
				<section className={`operation-card ${styles.budgetPanel}`}>
					<p className="eyebrow">{t.usageWindow}</p>
					<h2>{t.budgetTitle}</h2>
					{snapshot && insights ? (
						<>
							<div className={styles.budgetSummary}>
								<div
									className={styles.budgetRing}
									aria-hidden="true"
									style={{
										background: `conic-gradient(var(--accent) ${fill}%, var(--line-subtle) 0)`,
									}}
								>
									<span>
										{insights.budgetShare === null
											? "—"
											: percent.format(insights.budgetShare)}
									</span>
								</div>
								<div>
									<p className={styles.budgetValue}>
										{money.format(insights.accountedUsd)}
									</p>
									<p>{t.accounted}</p>
								</div>
							</div>
							{insights.budgetShare !== null ? (
								<meter
									className="sr-only"
									min={0}
									max={100}
									value={fill}
									aria-label={t.budgetShare}
									aria-valuetext={percent.format(insights.budgetShare)}
								/>
							) : (
								<p>{t.zeroBudget}</p>
							)}
							<dl>
								<dt>{t.remaining}</dt>
								<dd>{money.format(insights.remainingUsd)}</dd>
								<dt>{t.budget}</dt>
								<dd>{money.format(snapshot.usage.budgetUsd)}</dd>
								<dt>{t.input}</dt>
								<dd>{format.format(snapshot.usage.inputTokens)}</dd>
								<dt>{t.output}</dt>
								<dd>{format.format(snapshot.usage.outputTokens)}</dd>
							</dl>
						</>
					) : (
						<p>{t.notAvailable}</p>
					)}
					<p className={styles.caption}>{t.pricing}</p>
				</section>
			</div>
			{snapshot && (
				<details className={styles.provenance}>
					<summary>{t.snapshotDetails}</summary>
					<dl>
						<dt>API</dt>
						<dd>
							<code>{snapshot.apiCommit}</code>
						</dd>
						<dt>{t.pricingRevision}</dt>
						<dd>{snapshot.usage.pricingRevision}</dd>
					</dl>
				</details>
			)}
		</main>
	);
}
