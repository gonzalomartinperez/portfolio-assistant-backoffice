export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function record(value: unknown): Record<string, unknown> {
	if (!isRecord(value)) throw new Error("Expected an object");
	return value;
}
export function list(value: unknown): unknown[] {
	if (!Array.isArray(value)) throw new Error("Expected an array");
	return value;
}
export function field(value: unknown, ...keys: string[]): unknown {
	let current = value;
	for (const key of keys) {
		if (!isRecord(current)) return undefined;
		current = current[key];
	}
	return current;
}
export function text(value: unknown): string {
	if (typeof value !== "string") throw new Error("Expected a string");
	return value;
}
export function integer(value: unknown): number {
	if (typeof value !== "number" || !Number.isSafeInteger(value))
		throw new Error("Expected an integer");
	return value;
}
export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Unknown error";
}
