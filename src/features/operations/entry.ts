import "server-only";
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
