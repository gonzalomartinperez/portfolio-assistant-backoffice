import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
	testDir: "./tests/live",
	forbidOnly: !!process.env.CI,
	use: {
		...devices["Desktop Chrome"],
		baseURL: "http://localhost:3001",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	reporter: "list",
	webServer: {
		command: "node scripts/embed-host.ts",
		url: "http://localhost:3110",
		reuseExistingServer: false,
		env: { EMBED_FIXTURE_ASSISTANT_ORIGIN: "http://localhost:3001" },
	},
});
