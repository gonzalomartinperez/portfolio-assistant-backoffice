"use client";

import { useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { OperationalSnapshot } from "../domain/models";
import { operationsCopy, type OperationsLocale } from "./copy";

export function SnapshotChart({
	executions,
	usage,
	locale,
}: {
	executions: OperationalSnapshot["executions"];
	usage: OperationalSnapshot["usage"];
	locale: OperationsLocale;
}) {
	const [view, setView] = useState<"executions" | "tokens">("executions");
	const t = operationsCopy[locale];
	const data =
		view === "executions"
			? [
					{ name: t.completed, value: executions.completed },
					{ name: t.cancelled, value: executions.cancelled },
					{ name: t.failed, value: executions.failed },
				]
			: [
					{ name: t.input, value: usage.inputTokens },
					{ name: t.output, value: usage.outputTokens },
				];
	const format = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US");
	return (
		<section
			className="operation-card snapshot-chart"
			aria-labelledby="snapshot-chart-title"
		>
			<div className="operations-toolbar">
				<h2 id="snapshot-chart-title">{t.breakdown}</h2>
				<label htmlFor="snapshot-metric">{t.metricView}</label>
				<select
					id="snapshot-metric"
					value={view}
					onChange={(event) => {
						const value = event.target.value;
						if (value === "executions" || value === "tokens") setView(value);
					}}
				>
					<option value="executions">{t.executions}</option>
					<option value="tokens">{t.tokens}</option>
				</select>
			</div>
			<p>{t.snapshotOnly}</p>
			<div className="snapshot-chart-plot">
				<ResponsiveContainer width="100%" height="100%" minWidth={0}>
					<BarChart
						data={data}
						accessibilityLayer
						margin={{ top: 16, right: 16, bottom: 8, left: 8 }}
					>
						<CartesianGrid vertical={false} stroke="var(--line-strong)" />
						<XAxis
							dataKey="name"
							tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
							interval={0}
						/>
						<YAxis
							allowDecimals={false}
							width={56}
							tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
						/>
						<Tooltip
							cursor={{ fill: "var(--accent-wash)" }}
							contentStyle={{
								background: "var(--surface-raised)",
								color: "var(--text-primary)",
								borderColor: "var(--line-control)",
								borderRadius: "var(--radius-sm)",
							}}
						/>
						<Bar
							dataKey="value"
							name={t.total}
							fill="var(--accent)"
							radius={[4, 4, 0, 0]}
							isAnimationActive={false}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
			<table className="snapshot-chart-table">
				<caption>{view === "executions" ? t.executions : t.tokens}</caption>
				<thead>
					<tr>
						<th scope="col">{t.metricView}</th>
						<th scope="col">{t.total}</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item) => (
						<tr key={item.name}>
							<th scope="row">{item.name}</th>
							<td>{format.format(item.value)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
}
