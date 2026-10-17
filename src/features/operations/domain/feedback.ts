export interface FeedbackSnapshot {
	observedAt: string;
	up: number;
	down: number;
}
export type FeedbackRead =
	| { kind: "disabled" }
	| { kind: "unavailable" }
	| { kind: "available"; snapshot: FeedbackSnapshot };
export function helpfulShare(snapshot: FeedbackSnapshot): number | null {
	const total = snapshot.up + snapshot.down;
	return total ? snapshot.up / total : null;
}
