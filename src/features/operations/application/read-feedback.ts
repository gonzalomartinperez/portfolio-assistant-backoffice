import type { FeedbackRead } from "../domain/feedback.ts";
export interface FeedbackReadPort {
	read(): Promise<FeedbackRead>;
}
export function readFeedback(port: FeedbackReadPort): Promise<FeedbackRead> {
	return port.read();
}
