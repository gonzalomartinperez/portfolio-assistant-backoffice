"use client";
import { useState } from "react";
import {
	dailyTotals,
	eventNames,
	type ProductSnapshot,
	type EventName,
} from "../domain/models";
import { productCopy } from "./copy";
import styles from "./metrics.module.css";
export function ProductMetrics({
	snapshot,
	locale,
}: {
	snapshot: ProductSnapshot;
	locale: "en" | "es";
}) {
	const [selected, setSelected] = useState<EventName>("page_view");
	const t = productCopy[locale];
	const totals = dailyTotals(snapshot.counts, selected);
	const targetLabel = (target: string) =>
		Object.entries(t.targets).find(([key]) => key === target)?.[1] ?? "—";
	const maximum = Math.max(1, ...totals.map((row) => row.count));
	const format = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US");
	return (
		<section className="operation-card" aria-labelledby="product-counts-title">
			<h2 id="product-counts-title">{t.count}</h2>
			<label htmlFor="product-event">{t.metric}</label>{" "}
			<select
				id="product-event"
				value={selected}
				onChange={(event) => {
					const value = eventNames.find((name) => name === event.target.value);
					if (value) setSelected(value);
				}}
			>
				{eventNames.map((name) => (
					<option key={name} value={name}>
						{t.events[name]}
					</option>
				))}
			</select>
			{totals.length === 0 ? (
				<p role="status">{t.empty}</p>
			) : (
				<>
					<div className={styles.bars} aria-hidden="true">
						{totals.map((row) => (
							<div className={styles.row} key={row.day}>
								<span>{row.day}</span>
								<span className={styles.track}>
									<span
										className={styles.fill}
										style={{ width: `${(row.count / maximum) * 100}%` }}
									/>
								</span>
								<span>{format.format(row.count)}</span>
							</div>
						))}
					</div>
					<table className="snapshot-chart-table">
						<caption>
							{t.table} · {t.events[selected]}
						</caption>
						<thead>
							<tr>
								<th scope="col">{t.day}</th>
								<th scope="col">{t.count}</th>
							</tr>
						</thead>
						<tbody>
							{totals.map((row) => (
								<tr key={row.day}>
									<th scope="row">{row.day}</th>
									<td>{format.format(row.count)}</td>
								</tr>
							))}
						</tbody>
					</table>
					<details>
						<summary>{t.details}</summary>
						<ul>
							{snapshot.counts
								.filter((row) => row.eventName === selected)
								.map((row) => (
									<li
										key={[row.day, row.section, row.locale, row.target].join(
											"|",
										)}
									>
										{row.day} · {t.section}: {t.sections[row.section]} ·{" "}
										{t.locale}: {row.locale === "es" ? "Español" : "English"} ·{" "}
										{t.target}: {targetLabel(row.target)} ·{" "}
										{format.format(row.count)}
									</li>
								))}
						</ul>
					</details>
				</>
			)}
		</section>
	);
}
