import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const host = "http://localhost:3110";
async function open(page: Page) {
	await page.goto(host);
	await expect(page.locator("iframe")).toHaveCount(0);
	await page.getByRole("button", { name: "Open assistant" }).click();
	await expect(page.locator("#status")).toHaveText("Connected", {
		timeout: 8000,
	});
	const chat = page.frameLocator("iframe");
	await expect(chat.getByRole("textbox")).toBeFocused();
	return chat;
}
test("embed handshake, same-frame minimize/maximize, preferences and cross-frame keyboard", async ({
	page,
}, info) => {
	const chat = await open(page);
	const frame = page.frames().find((item) => item.url().includes("/embed"));
	expect(frame).toBeDefined();
	await expect(chat.getByRole("combobox")).toHaveCount(0);
	await chat.getByRole("textbox").fill("What is Filomena?");
	await chat.getByRole("button", { name: "Send", exact: true }).click();
	await expect(
		chat.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Maximize", exact: true }).click();
	await page.getByRole("button", { name: "Restore", exact: true }).click();
	await page.getByRole("button", { name: "Minimize", exact: true }).click();
	await expect(page.locator("#panel")).toBeHidden();
	await expect(page.locator("#panel")).toHaveAttribute("inert", "");
	await expect(page.locator("#launcher")).toBeFocused();
	await page.locator("#launcher").click();
	expect(page.frames().find((item) => item.url().includes("/embed"))).toBe(
		frame,
	);
	await expect(
		chat.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
	await page.getByLabel("Host theme").selectOption("light");
	await page.getByLabel("Host language").selectOption("es");
	await expect(chat.locator("html")).toHaveAttribute("data-theme", "light");
	await expect(chat.locator("html")).toHaveAttribute("lang", "es");
	await page.screenshot({
		path: info.outputPath("embedded-desktop-light-es.png"),
	});
	expect(
		(
			await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
				.analyze()
		).violations,
	).toEqual([]);
	await chat.getByRole("textbox").focus();
	await page.keyboard.press("Escape");
	await expect(page.locator("#launcher")).toBeFocused();
	await expect(page.locator("#panel")).toBeHidden();
	await page.locator("#launcher").click();
	await chat
		.getByRole("button", { name: "Conversaciones", exact: true })
		.click();
	await page.keyboard.press("Escape");
	await expect(page.locator("#panel")).toBeVisible();
	await expect(
		chat.getByRole("button", { name: "Conversaciones", exact: true }),
	).toBeFocused();
	await page.locator("#maximize").focus();
	await page.keyboard.press("Tab");
	await expect(
		chat.getByRole("link", { name: "Ir a la pregunta" }),
	).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect(page.locator("#maximize")).toBeFocused();
});
test("minimized stream finishes once and reopens the same conversation", async ({
	page,
}) => {
	const chat = await open(page);
	let generations = 0;
	page.on("request", (request) => {
		if (
			request.method() === "POST" &&
			request.url().endsWith("/messages/stream")
		)
			generations++;
	});
	await chat.getByRole("textbox").fill("slow");
	await chat.getByRole("button", { name: "Send", exact: true }).click();
	await expect(
		chat.getByRole("button", { name: "Stop", exact: true }),
	).toBeVisible();
	await page.locator("#minimize").click();
	await expect(chat.locator("[data-hidden]")).toHaveCount(1);
	const completion = page.waitForResponse(
		(response) =>
			response.url().includes("/messages") &&
			response.request().method() === "GET",
	);
	await completion;
	await page.locator("#launcher").click();
	await expect(
		chat.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
	expect(generations).toBe(1);
});
test("embed ignores wrong origin/source, malformed versions and unsupported actions", async ({
	page,
}) => {
	const chat = await open(page);
	await page.evaluate(() => {
		const target = document.querySelector("iframe")?.contentWindow;
		for (const message of [
			{
				version: 2,
				type: "host.preferences",
				preferences: { theme: "light", locale: "es" },
			},
			{ version: 1, type: "host.visibility", visible: "false" },
			{
				version: 1,
				type: "host.preferences",
				preferences: { theme: "light", locale: "es" },
				secret: "extra",
			},
		])
			target?.postMessage(message, "http://localhost:3107");
	});
	const frame = page.frames().find((item) => item.url().includes("/embed"));
	await frame?.evaluate(() => {
		const data = {
			version: 1,
			type: "host.preferences",
			preferences: { theme: "light", locale: "es" },
		};
		window.dispatchEvent(
			new MessageEvent("message", {
				data,
				origin: "https://untrusted.example",
				source: window.parent,
			}),
		);
		window.dispatchEvent(
			new MessageEvent("message", {
				data,
				origin: "http://localhost:3110",
				source: window,
			}),
		);
	});
	await expect(chat.locator("html")).toHaveAttribute("data-theme", "dark");
	await expect(chat.locator("html")).toHaveAttribute("lang", "en");
	await expect(chat.getByRole("textbox")).toBeVisible();
	const standalone = await page.request.get("http://localhost:3107/");
	expect(standalone.headers()["content-security-policy"]).toBe(
		"frame-ancestors 'none'",
	);
	expect(standalone.headers()["x-frame-options"]).toBe("DENY");
	const embedded = await page.request.get("http://localhost:3107/embed");
	expect(embedded.headers()["content-security-policy"]).toBe(
		"frame-ancestors http://localhost:3110",
	);
	expect(embedded.headers()["x-frame-options"]).toBeUndefined();
});
test("mobile embed, reduced motion and removal during streaming", async ({
	page,
}, info) => {
	await page.setViewportSize({ width: 390, height: 720 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	const chat = await open(page);
	await expect(chat.locator("[data-identity-avatar]")).toHaveCount(1);
	await page.screenshot({
		path: info.outputPath("embedded-mobile-dark-en.png"),
	});
	await page.setViewportSize({ width: 390, height: 420 });
	await expect(chat.getByRole("textbox")).toBeInViewport();
	await expect(
		chat.getByRole("button", { name: "Send", exact: true }),
	).toBeInViewport();
	await chat.getByRole("textbox").fill("slow");
	await chat.getByRole("button", { name: "Send", exact: true }).click();
	await expect(
		chat.getByRole("button", { name: "Stop", exact: true }),
	).toBeVisible();
	await page.evaluate(() =>
		document.querySelector<HTMLButtonElement>("#remove")?.click(),
	);
	await expect(page.locator("iframe")).toHaveCount(0);
	await expect(
		page.getByRole("link", { name: "Host navigation" }),
	).toBeVisible();
});
test("readiness timeout is explicit; unavailable API does not claim readiness", async ({
	page,
}) => {
	await page.route("**/embed?**", (route) =>
		route.fulfill({
			contentType: "text/html",
			body: "<!doctype html><title>Unavailable fixture</title>",
		}),
	);
	await page.goto(host);
	await page.clock.install();
	await page.locator("#launcher").click();
	await page.clock.fastForward(8100);
	await expect(page.locator("#retry")).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Host navigation" }),
	).toBeVisible();
	await page.unroute("**/embed?**");
	await page.route("**/api/v1/session", (route) =>
		route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
	);
	await page.locator("#retry").click();
	await expect(page.locator("#status")).toContainText("Assistant unavailable");
	await expect(
		page
			.frameLocator("iframe")
			.getByRole("alert")
			.filter({ hasText: "The assistant is unavailable" }),
	).toBeVisible();
});

test("unapproved host cannot frame the assistant", async ({ page }) => {
	const violation = page.waitForEvent(
		"console",
		(message) =>
			message.text().includes("frame-ancestors") ||
			message.text().includes("ancestor"),
	);
	await page.goto("http://127.0.0.1:3110");
	await page.locator("#launcher").click();
	await violation;
	await expect(page.locator("#status")).not.toHaveText("Connected");
	await expect(
		page.getByRole("link", { name: "Host navigation" }),
	).toBeVisible();
});
test("embedded cancellation and responsive layouts retain essential controls", async ({
	page,
}, info) => {
	const chat = await open(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect(chat.locator("[data-identity-avatar]")).toHaveCSS(
		"transform",
		"none",
	);
	for (const size of [
		{ width: 320, height: 640 },
		{ width: 844, height: 390 },
		{ width: 768, height: 1024 },
	]) {
		await page.setViewportSize(size);
		await expect(chat.getByRole("textbox")).toBeInViewport();
		await expect(
			chat.getByRole("button", { name: "Send", exact: true }),
		).toBeInViewport();
		expect(
			await chat
				.locator("body")
				.evaluate((body) => body.scrollWidth <= body.clientWidth),
		).toBe(true);
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => {
		document.documentElement.style.fontSize = "200%";
	});
	const frame = page.frames().find((item) => item.url().includes("/embed"));
	await frame?.evaluate(() => {
		document.documentElement.style.fontSize = "200%";
	});
	await expect(chat.getByRole("textbox")).toBeInViewport();
	await expect(
		chat.getByRole("button", { name: "Send", exact: true }),
	).toBeInViewport();
	await frame?.evaluate(() => {
		document.documentElement.style.fontSize = "100%";
	});
	await chat.getByRole("textbox").fill("slow");
	await chat.getByRole("button", { name: "Send", exact: true }).click();
	await expect(chat.locator("article pre")).toContainText(
		"This is a deterministic",
	);
	await chat.getByRole("button", { name: "Stop", exact: true }).click();
	await expect(
		chat.getByRole("button", { name: "Stop", exact: true }),
	).toHaveCount(0);
	await expect(
		chat.getByText("Incomplete response", { exact: false }),
	).toBeVisible();
	await page.screenshot({
		path: info.outputPath("embedded-mobile-cancelled.png"),
	});
});

test("visibility does not replay focus and delayed readiness respects changed user intent", async ({
	page,
}) => {
	let release: () => void = () => {};
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route("**/api/v1/session", async (route) => {
		await gate;
		await route.continue();
	});
	await page.goto(host);
	await page.locator("#launcher").click();
	await page.getByRole("link", { name: "Host navigation" }).focus();
	await page.keyboard.press("Tab");
	release();
	await expect(page.locator("#status")).toHaveText("Connected", {
		timeout: 8000,
	});
	const chat = page.frameLocator("iframe");
	await expect(chat.getByRole("textbox")).not.toBeFocused();
	await page.locator("#minimize").click();
	await page.locator("#launcher").click();
	await expect(chat.getByRole("textbox")).toBeFocused();
	await page.locator("#maximize").focus();
	await page.evaluate(() =>
		document
			.querySelector("iframe")
			?.contentWindow?.postMessage(
				{ version: 1, type: "host.visibility", visible: false },
				"http://localhost:3107",
			),
	);
	await expect(chat.locator("[data-hidden]")).toHaveCount(1);
	await page.evaluate(() => {
		const target = document.querySelector("iframe")?.contentWindow;
		target?.postMessage(
			{ version: 1, type: "host.focus" },
			"http://localhost:3107",
		);
		target?.postMessage(
			{ version: 1, type: "host.visibility", visible: true },
			"http://localhost:3107",
		);
	});
	await expect(chat.locator("[data-hidden]")).toHaveCount(0);
	await expect(page.locator("#maximize")).toBeFocused();
});

test("embedded long conversation preserves reading position, safe sources and follow-up drafts", async ({
	page,
}, info) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const chat = await open(page);
	await chat.getByRole("textbox").fill("long");
	await chat.getByRole("button", { name: "Send", exact: true }).click();
	const log = chat.getByRole("log");
	await expect
		.poll(() =>
			log.evaluate((node) => node.scrollHeight > node.clientHeight + 500),
		)
		.toBe(true);
	await log.evaluate((node) => {
		node.scrollTop = 0;
		node.dispatchEvent(new Event("scroll"));
	});
	await expect(
		chat.getByRole("heading", { name: "Public sources" }),
	).toBeAttached();
	await expect.poll(() => log.evaluate((node) => node.scrollTop)).toBe(0);
	await expect(chat.locator('a[href^="javascript:"]')).toHaveCount(0);
	await chat.getByRole("button", { name: /Jump to latest/ }).click();
	await expect(
		chat.getByRole("heading", { name: "Public sources" }),
	).toBeInViewport();
	await expect(chat.getByRole("link", { name: /projects.ts/ })).toHaveAttribute(
		"rel",
		/noopener/,
	);
	await chat
		.getByRole("region", { name: "Explore next" })
		.getByRole("button")
		.first()
		.click();
	await expect(chat.getByRole("textbox")).toBeFocused();
	await expect(chat.getByRole("textbox")).not.toHaveValue("");
	await expect(
		chat.getByRole("button", { name: "Stop", exact: true }),
	).toHaveCount(0);
	await page.screenshot({ path: info.outputPath("embedded-mobile-long.png") });
});
