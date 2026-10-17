import { setTimeout as sleep } from "node:timers/promises";

export async function waitForPostgres(
	probe: () => string,
	pause: () => Promise<void> = () => sleep(1000),
	attempts = 60,
): Promise<void> {
	for (let attempt = 0; attempt < attempts; attempt++) {
		try {
			if (probe() === "1") return;
		} catch {
			// Cold initialization may expose a socket before the target database exists.
		}
		if (attempt + 1 < attempts) await pause();
	}
	throw new Error("Owned IAM fixture SQL readiness failed");
}
