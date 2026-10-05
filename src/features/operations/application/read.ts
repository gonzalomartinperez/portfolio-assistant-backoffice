import type { OperationalRead } from "../domain/models";
export interface OperationsPort {
	read(): Promise<OperationalRead>;
}
export async function readOperations(
	port: OperationsPort,
): Promise<OperationalRead> {
	return port.read();
}
