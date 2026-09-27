import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
	testDir: "./tests/browser",
	timeout: 30_000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	...(process.env.CI ? { workers: 2 } : {}),
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: "http://localhost:3107",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
	webServer: {
		command: "node scripts/test-server.ts",
		url: "http://localhost:3107",
		reuseExistingServer: false,
		timeout: 60_000,
	},
});
