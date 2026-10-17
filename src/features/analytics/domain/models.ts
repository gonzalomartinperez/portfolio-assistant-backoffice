export const eventNames = [
	"page_view",
	"navigation_click",
	"section_open",
	"cv_link_open",
	"contact_link_open",
	"company_link_open",
] as const;
export const sections = [
	"home",
	"about",
	"work",
	"filomena",
	"stack",
	"education",
	"cv",
	"contact",
] as const;
export type EventName = (typeof eventNames)[number];
export type Section = (typeof sections)[number];
export type ProductCount = {
	day: string;
	eventName: EventName;
	section: Section;
	locale: "en" | "es";
	target: string;
	count: number;
};
export type ProductSnapshot = { counts: ProductCount[] };
export type ProductRead =
	| { kind: "disabled" }
	| { kind: "unavailable" }
	| { kind: "available"; snapshot: ProductSnapshot };
export function dailyTotals(counts: ProductCount[], eventName: EventName) {
	const totals = new Map<string, number>();
	for (const row of counts)
		if (row.eventName === eventName)
			totals.set(row.day, (totals.get(row.day) ?? 0) + row.count);
	return [...totals]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([day, count]) => ({ day, count }));
}
