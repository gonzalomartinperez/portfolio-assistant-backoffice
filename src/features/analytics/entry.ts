import "server-only";
import { readProductAnalytics } from "./application/read";
import { createProductHttp } from "./adapters/http";
export function loadProductAnalytics() {
	return readProductAnalytics(
		createProductHttp({
			enabled: process.env.PRODUCT_ANALYTICS_ENABLED === "true",
			origin: process.env.OPERATIONS_API_ORIGIN,
			token: process.env.OPERATIONS_READ_TOKEN,
		}),
	);
}
