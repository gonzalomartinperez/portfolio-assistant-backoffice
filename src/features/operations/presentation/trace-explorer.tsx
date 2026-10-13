"use client";

import { useState } from "react";
import type { ExecutionTrace, RunOutcome } from "../domain/models";
import { selectTraces } from "../domain/insights";
import { operationsCopy, type OperationsLocale } from "./copy";
import styles from "./workbench.module.css";

export function TraceExplorer({
	traces,
	locale,
}: {
	traces: readonly ExecutionTrace[];
	locale: OperationsLocale;
}) {
	const [outcome, setOutcome] = useState<RunOutcome | "all">("all");
	const [query, setQuery] = useState("");
	const t = operationsCopy[locale];
	const format = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US");
	const visible = selectTraces(traces, outcome, query);
	return (
		<div>
			<div className={styles.traceFilters}>
				<div className={styles.traceField}>
					<label htmlFor="trace-outcome">{t.traceFilter}</label>
					<select
						id="trace-outcome"
						value={outcome}
						onChange={(event) => {
							const value = event.target.value;
							if (
								value === "all" ||
								value === "completed" ||
								value === "cancelled" ||
								value === "failed"
							)
								setOutcome(value);
						}}
					>
						<option value="all">{t.allOutcomes}</option>
						<option value="completed">{t.completed}</option>
						<option value="cancelled">{t.cancelled}</option>
						<option value="failed">{t.failed}</option>
					</select>
				</div>
				<div className={styles.traceField}>
					<label htmlFor="trace-query">{t.traceSearch}</label>
					<input
						id="trace-query"
						type="search"
						value={query}
						maxLength={32}
						autoComplete="off"
						onChange={(event) => setQuery(event.target.value.slice(0, 32))}
					/>
				</div>
			</div>
			<p className={styles.filteredCount} role="status">
				{t.results}: {format.format(visible.length)}
			</p>
			{visible.length === 0 ? (
				<p>{traces.length === 0 ? t.emptyTraces : t.noMatchingTraces}</p>
			) : (
				<ul className="trace-list">
					{visible.map((trace) => {
						const longestStage = Math.max(
							0,
							...trace.stages.map((stage) => stage.durationMs),
						);
						return (
							<li key={trace.id}>
								<details className={styles.traceDetail}>
									<summary>
										<span className={styles.traceIdentity}>
											<span
												className={styles.outcomeBadge}
												data-outcome={trace.outcome}
											>
												{t[trace.outcome]}
											</span>
											<code>{trace.id.slice(0, 12)}</code>
										</span>
										<span>{format.format(trace.durationMs)} ms</span>
									</summary>
									<p>
										<time dateTime={trace.startedAt}>
											{trace.startedAt
												.replace("T", " ")
												.replace(/\.\d+Z$/, " UTC")}
										</time>
									</p>
									<ol className={styles.stages}>
										{trace.stages.map((stage) => (
											<li key={stage.id}>
												<span>
													{stage.name === "language"
														? t.languageStage
														: t[stage.name]}
												</span>
												<span className={styles.stageTrack} aria-hidden="true">
													<span
														style={{
															width: `${longestStage > 0 ? (stage.durationMs / longestStage) * 100 : 0}%`,
														}}
													/>
												</span>
												<span>{format.format(stage.durationMs)} ms</span>
											</li>
										))}
									</ol>
								</details>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
