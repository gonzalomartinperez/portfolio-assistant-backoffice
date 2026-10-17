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

for (const locale of ["en", "es"] as const) {
	for (const theme of ["dark", "light"] as const) {
		test(`mobile overview is accessible in ${locale}/${theme} without horizontal clipping`, async ({
			page,
			context,
		}) => {
			test.skip(!available, "Available-mode lifecycle only");
			await authenticate(context, "viewer");
			await page.setViewportSize({ width: 390, height: 844 });
			await page.emulateMedia({ reducedMotion: "reduce" });
			await page.goto(`/?locale=${locale}`);
			await expect(
				page.getByRole("heading", {
					name:
						locale === "es"
							? "Operaciones del asistente"
							: "Assistant operations",
					exact: true,
				}),
			).toBeVisible();
			await page.evaluate((value) => {
				document.documentElement.dataset.theme = value;
			}, theme);
			await expect
				.poll(() =>
					page.evaluate(
						() => document.documentElement.scrollWidth <= window.innerWidth,
					),
				)
				.toBe(true);
			expect(
				await page
					.getByRole("searchbox")
					.evaluate((element) =>
						Number.parseFloat(getComputedStyle(element).fontSize),
					),
			).toBeGreaterThanOrEqual(16);
			const accessibility = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
				.analyze();
			expect(accessibility.violations).toEqual([]);
			await page.screenshot({
				path: `test-results/backoffice-${test.info().project.name}-mobile-${locale}-${theme}.png`,
				fullPage: true,
			});
		});
	}
}

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

test("workbench budget and latency use observed data without invented targets", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "owner");
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Budget headroom" }),
	).toBeVisible();
	await expect(page.getByText("$0.03", { exact: true })).toBeVisible();
	await expect(page.getByText("$9.97", { exact: true })).toBeVisible();
	await expect(page.getByText("320 ms", { exact: true })).toBeVisible();
	await expect(page.getByText("840 ms", { exact: true })).toBeVisible();
	const meter = page.getByRole("meter", { name: "Budget accounted for" });
	expect(Number(await meter.getAttribute("value"))).toBeCloseTo(0.3);
	await page.getByText("Snapshot details", { exact: true }).click();
	await expect(page.getByText("fixture-1", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Explore in Grafana" }),
	).toHaveCount(0);
});

test("sampled execution filtering and ID search preserve clear empty states", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "viewer");
	await page.goto("/");
	await page
		.getByLabel("Filter by outcome", { exact: true })
		.selectOption("failed");
	await expect(
		page.getByText("No sampled executions match these filters.", {
			exact: true,
		}),
	).toBeVisible();
	await page
		.getByLabel("Filter by outcome", { exact: true })
		.selectOption("all");
	await page.getByLabel("Trace ID", { exact: true }).fill("missing");
	await expect(
		page.getByText("No sampled executions match these filters.", {
			exact: true,
		}),
	).toBeVisible();
	await page.getByLabel("Trace ID", { exact: true }).fill("CCCC");
	await page.locator("summary").filter({ hasText: "cccccccccccc" }).click();
	await expect(
		page.getByText("Vector retrieval", { exact: true }),
	).toBeVisible();
	await expect(page.getByText("Generation", { exact: true })).toBeVisible();
	await expect(page.getByLabel("Trace ID", { exact: true })).toHaveValue(
		"CCCC",
	);
});

test("preferences close with Escape and restore their summary focus", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "viewer");
	await page.goto("/");
	await page.getByText("Preferences", { exact: true }).click();
	await page.getByRole("combobox", { name: "Theme", exact: true }).focus();
	await page.keyboard.press("Escape");
	await expect(
		page.getByRole("combobox", { name: "Theme", exact: true }),
	).not.toBeVisible();
	await expect(
		page.locator("summary").filter({ hasText: "Preferences" }),
	).toBeFocused();
});

test("workbench stays usable at compact, landscape and resized text widths", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available-mode lifecycle only");
	await authenticate(context, "viewer");
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/?locale=es");
	for (const viewport of [
		{ width: 320, height: 700 },
		{ width: 844, height: 390 },
		{ width: 768, height: 1024 },
		{ width: 1440, height: 900 },
	]) {
		await page.setViewportSize(viewport);
		await expect
			.poll(() =>
				page.evaluate(
					() => document.documentElement.scrollWidth <= window.innerWidth,
				),
			)
			.toBe(true);
		await expect(
			page.getByRole("button", { name: "Actualizar datos", exact: true }),
		).toBeVisible();
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => {
		document.documentElement.style.fontSize = "200%";
	});
	await expect
		.poll(() =>
			page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		)
		.toBe(true);
	await expect(
		page.getByRole("button", { name: "Actualizar datos", exact: true }),
	).toBeVisible();
});

test("private product analytics requires live access", async ({ page }) => {
	await page.goto("/analytics");
	await expect(page).toHaveURL(/\/sign-in/);
	await expect(
		page.getByRole("heading", { name: "Portfolio interactions" }),
	).toHaveCount(0);
});

test("product counts have honest labels, keyboard filtering and table alternatives", async ({
	page,
	context,
}) => {
	test.skip(!available, "Available fixture only");
	await authenticate(context, "viewer");
	await page.goto("/analytics?locale=en");
	await expect(
		page.getByRole("heading", { name: "Portfolio interactions" }),
	).toBeVisible();
	await expect(
		page.getByText("Synthetic fixture data · not production analytics"),
	).toBeVisible();
	await expect(page.getByRole("table", { name: /Daily counts/ })).toBeVisible();
	await page.getByLabel("Interaction", { exact: true }).focus();
	await page
		.getByLabel("Interaction", { exact: true })
		.selectOption("cv_link_open");
	await expect(
		page.getByRole("table").getByRole("cell", { name: "7", exact: true }),
	).toBeVisible();
	await page
		.getByLabel("Interaction", { exact: true })
		.selectOption("company_link_open");
	await expect(page.getByRole("status")).toHaveText(
		"No accepted events in this window.",
	);
	await page
		.getByLabel("Interaction", { exact: true })
		.selectOption("page_view");
	const findings = await new AxeBuilder({ page }).analyze();
	expect(findings.violations).toEqual([]);
	await page.screenshot({
		path: `test-results/product-${test.info().project.name}-desktop-en.png`,
		fullPage: true,
	});
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/analytics?locale=es");
	await expect(
		page.getByRole("heading", { name: "Interacciones del portfolio" }),
	).toBeVisible();
	await page.getByText("Preferencias", { exact: true }).click();
	await page.getByLabel("Tema", { exact: true }).selectOption("light");
	await page.keyboard.press("Escape");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).toBe(true);
	expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
	await page.screenshot({
		path: `test-results/product-${test.info().project.name}-mobile-es.png`,
		fullPage: true,
	});
});

test("privacy notice is bilingual, accessible and public without starting OAuth", async ({
	page,
}) => {
	for (const locale of ["en", "es"]) {
		await page.goto(`/privacy?locale=${locale}`);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			locale === "en" ? "Privacy and data" : "Privacidad y datos",
		);
		await expect(
			page.getByRole("link", {
				name:
					locale === "en"
						? "Contact the maintainer"
						: "Contactar al responsable",
			}),
		).toHaveAttribute(
			"href",
			`https://gonzalomartinperez.com/${locale === "es" ? "es/" : ""}contact`,
		);
		expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
	}
});
