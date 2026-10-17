import type { ProductRead } from "../domain/models.ts";
export interface ProductReadPort {
	read(): Promise<ProductRead>;
}
export function readProductAnalytics(
	port: ProductReadPort,
): Promise<ProductRead> {
	return port.read();
}
