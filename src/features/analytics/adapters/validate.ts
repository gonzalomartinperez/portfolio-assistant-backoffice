import type { components } from "../../../../contracts/product-analytics.types";
import {
	eventNames,
	sections,
	type ProductSnapshot,
} from "../domain/models.ts";
function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Invalid analytics payload");
	return Object.fromEntries(Object.entries(value));
}
function exact(value: Record<string, unknown>, keys: string[]) {
	if (
		Object.keys(value).length !== keys.length ||
		keys.some((key) => !Object.hasOwn(value, key))
	)
		throw new Error("Invalid analytics fields");
}
function member<T extends string>(values: readonly T[], value: unknown): T {
	for (const candidate of values) if (value === candidate) return candidate;
	throw new Error("Invalid analytics dimension");
}
export function parseProductSnapshot(value: unknown): ProductSnapshot {
	const root = object(value);
	exact(root, [
		"schema_version",
		"project",
		"window_days",
		"country",
		"counts",
	]);
	if (
		root.schema_version !== 1 ||
		root.project !== "portfolio" ||
		root.window_days !== 7 ||
		root.country !== "unknown" ||
		!Array.isArray(root.counts) ||
		root.counts.length > 4000
	)
		throw new Error("Invalid analytics contract");
	const keys = new Set<string>();
	let total = 0;
	return {
		counts: root.counts.map((value: unknown) => {
			const row = object(value);
			exact(row, ["day", "event_name", "section", "locale", "target", "count"]);
			if (
				typeof row.day !== "string" ||
				!/^\d{4}-\d{2}-\d{2}$/.test(row.day) ||
				!Number.isFinite(Date.parse(row.day)) ||
				new Date(row.day).toISOString().slice(0, 10) !== row.day ||
				typeof row.count !== "number" ||
				!Number.isSafeInteger(row.count) ||
				row.count < 1 ||
				row.count > 10000 ||
				typeof row.target !== "string"
			)
				throw new Error("Invalid analytics count");
			const eventName = member(eventNames, row.event_name);
			const section = member(sections, row.section);
			const locale = member(["en", "es"], row.locale);
			const targets: Record<typeof eventName, readonly string[]> = {
				page_view: [""],
				navigation_click: [""],
				section_open: [
					"rampy",
					"teamcubation",
					"cooperativa-obrera",
					"independent",
				],
				cv_link_open: ["en", "es"],
				contact_link_open: ["email", "linkedin", "github"],
				company_link_open: ["rampy", "teamcubation", "cooperativa-obrera"],
			};
			if (
				!targets[eventName].includes(row.target) ||
				(["section_open", "company_link_open"].includes(eventName) &&
					section !== "work") ||
				(eventName === "cv_link_open" && section !== "cv")
			)
				throw new Error("Invalid analytics combination");
			const key = [row.day, eventName, section, locale, row.target].join("|");
			if (keys.has(key)) throw new Error("Duplicate analytics cell");
			keys.add(key);
			total += row.count;
			if (total > 70000) throw new Error("Invalid analytics total");
			const wire: components["schemas"]["ProductCount"] = {
				day: row.day,
				event_name: eventName,
				section,
				locale,
				target: row.target,
				count: row.count,
			};
			return {
				day: wire.day,
				eventName,
				section,
				locale,
				target: row.target,
				count: row.count,
			};
		}),
	};
}
