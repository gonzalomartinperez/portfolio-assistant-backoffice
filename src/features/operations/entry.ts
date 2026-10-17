import "server-only";
import { createFeedbackHttp } from "./adapters/feedback-http";
import { readFeedback } from "./application/read-feedback";
import { readOperations } from "./application/read";
import { createOperationsHttp } from "./adapters/http";
import { validateGrafanaDestination } from "./adapters/grafana-link";
export function loadGrafanaDestination() {
	return validateGrafanaDestination(process.env.OPERATIONS_GRAFANA_URL);
}
export function loadOperations() {
	return readOperations(
		createOperationsHttp({
			origin: process.env.OPERATIONS_API_ORIGIN,
			token: process.env.OPERATIONS_READ_TOKEN,
		}),
	);
}

export function loadFeedback() {
	return readFeedback(
		createFeedbackHttp({
			enabled: process.env.FEEDBACK_OVERVIEW_ENABLED === "true",
			origin: process.env.OPERATIONS_API_ORIGIN,
			token: process.env.OPERATIONS_READ_TOKEN,
		}),
	);
}
