import { readFileSync } from "node:fs";
import { test, expect, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { field, record, text } from "../../scripts/json.ts";

const available =
	(process.env.OPERATIONS_FIXTURE_MODE ?? "available") === "available";
async function authenticate(context: BrowserContext, role: "owner" | "viewer") {
	const sessions = record(
		JSON.parse(readFileSync(".artifacts/fixture-sessions.json", "utf8")),
	);
	const cookie = record(field(sessions, role, "cookie"));
	await context.addCookies([
		{
			name: text(cookie.name),
			value: text(cookie.value),
			url: "http://localhost:3107",
			httpOnly: true,
			secure: false,
			sameSite: "Lax",
		},
	]);
}

test("unauthenticated visitors cannot read operational data", async ({
	page,
	request,
}) => {
	await page.goto("/");
	await expect(page).toHaveURL(/\/sign-in/);
	await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
	await expect(page.getByRole("button", { name: /GitHub/ })).toBeVisible();
	const response = await request.get("/api/operations");
	expect(response.status()).toBe(401);
	expect(await response.text()).not.toContain("fixture-1");
	expect(response.headers()["x-frame-options"]).toBe("DENY");
	expect(response.headers()["content-security-policy"]).toContain(
		"frame-ancestors 'none'",
	);
	expect((await request.get("/embed")).status()).toBe(404);
});

test("health and database readiness have distinct public semantics", async ({
	request,
}) => {
	const health = await request.get("/api/health");
	expect(health.ok()).toBe(true);
	const ready = await request.get("/api/ready");
	expect(ready.ok()).toBe(true);
	expect(ready.headers()["cache-control"]).toContain("no-store");
});

test("owner receives validated fixture metrics and restricted access navigation", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "owner");
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Assistant operations" }),
	).toBeVisible();
	await expect(
		page.getByText("Synthetic fixture data · not production telemetry"),
	).toBeVisible();
	await expect(page.getByText("fixture-1", { exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Manage access" })).toBeVisible();
	const data = await page.request.get("/api/operations");
	expect(data.ok()).toBe(true);
	expect(data.headers()["cache-control"]).toContain("no-store");
	expect(await data.text()).not.toContain("public-loopback-operations-fixture");
	await expect(page.getByRole("table", { name: "Executions" })).toBeVisible();
	await page.getByRole("application").focus();
	await page.keyboard.press("ArrowRight");
	await expect(page.locator(".recharts-tooltip-wrapper")).toBeVisible();
	await page.getByLabel("Metric", { exact: true }).selectOption("tokens");
	await expect(page.getByRole("table", { name: "Tokens" })).toBeVisible();
	await expect(
		page.getByRole("table").getByRole("row", { name: /Input tokens/ }),
	).toBeVisible();
	await page.getByLabel("Metric", { exact: true }).selectOption("executions");
	await expect(page.getByRole("table", { name: "Executions" })).toBeVisible();
	await page.locator("summary").filter({ hasText: "cccccccccccc" }).click();
	await expect(
		page.getByText("Vector retrieval", { exact: true }),
	).toBeVisible();
	await expect(page.getByText("Generation", { exact: true })).toBeVisible();
	await expect(page.getByText("Graph retrieval", { exact: true })).toHaveCount(
		0,
	);
	await page.screenshot({
		path: `test-results/backoffice-${test.info().project.name}-desktop-en.png`,
		fullPage: true,
	});
});

test("viewer can read operations but cannot enter owner access management", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "viewer");
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Assistant operations" }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Manage access" })).toHaveCount(
		0,
	);
	await page.goto("/access");
	await expect(page).toHaveURL("http://localhost:3107/");
	await expect(
		page.getByRole("heading", {
			name: /Access management|Administración de acceso/,
		}),
	).toHaveCount(0);
});

test("preferences synchronize language and the single theme authority", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "owner");
	await page.goto("/");
	await page.getByText("Preferences", { exact: true }).click();
	await page
		.getByRole("combobox", { name: "Theme", exact: true })
		.selectOption("light");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	await page
		.getByRole("combobox", { name: "Language", exact: true })
		.selectOption("es");
	await expect(
		page.getByRole("heading", { name: "Operaciones del asistente" }),
	).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("lang", "es");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("responsive overview is accessible in both themes without horizontal clipping", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "viewer");
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/?locale=es");
	await expect(
		page.getByRole("heading", { name: "Operaciones del asistente" }),
	).toBeVisible();
	for (const theme of ["dark", "light"]) {
		await page.evaluate((value) => {
			document.documentElement.dataset.theme = value;
		}, theme);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		const accessibility = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();
		expect(accessibility.violations).toEqual([]);
	}
	await page.screenshot({
		path: `test-results/backoffice-${test.info().project.name}-mobile-es.png`,
		fullPage: true,
	});
});

test("operational failure presents safe no-data state without fabricated metrics", async ({
	page,
	context,
}) => {
	test.skip(available, "Separate unavailable/malformed fixture lifecycle");
	await authenticate(context, "viewer");
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Operational data is unavailable" }),
	).toBeVisible();
	await expect(page.getByText("fixture-1", { exact: true })).toHaveCount(0);
	await expect(
		page.getByRole("button", { name: "Refresh data" }),
	).toBeVisible();
	const response = await page.request.get("/api/operations");
	expect(response.status()).toBe(503);
	expect(await response.text()).not.toContain(
		"public-loopback-operations-fixture",
	);
});

test("owner invitation confirmation supports Escape and focus restoration", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "owner");
	await page.goto("/access?locale=en");
	const email = `guest-${test.info().project.name}-${Date.now()}@example.test`;
	await page.getByLabel("Guest email", { exact: true }).fill(email);
	await page
		.getByRole("button", { name: "Invite viewer", exact: true })
		.click();
	await expect(page.getByLabel("Invitation link", { exact: true })).toHaveValue(
		/http:\/\/localhost:3107\/access\/invitation\?token=/,
	);
	const trigger = page.getByRole("button", {
		name: `Revoke ${email}`,
		exact: true,
	});
	await trigger.click();
	await expect(
		page.getByRole("dialog", { name: "Revoke access?" }),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(
		page.getByRole("dialog", { name: "Revoke access?" }),
	).not.toBeVisible();
	await expect(trigger).toBeFocused();
	await trigger.click();
	await page
		.getByRole("button", { name: "Confirm revocation", exact: true })
		.click();
	await expect(trigger).toHaveCount(0);
	await expect(
		page.getByRole("listitem").filter({ hasText: email }),
	).toContainText("Revoked");
});
