import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
	testDir: "./tests/browser",
	timeout: 30_000,
	use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3001" },
	reporter: "list",
});
