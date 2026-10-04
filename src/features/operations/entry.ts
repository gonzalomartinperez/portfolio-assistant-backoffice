import "server-only";
import { readOperations } from "./application/read";
import { createOperationsHttp } from "./adapters/http";
export function loadOperations() {
	return readOperations(
		createOperationsHttp({
			origin: process.env.OPERATIONS_API_ORIGIN,
			token: process.env.OPERATIONS_READ_TOKEN,
		}),
	);
}
