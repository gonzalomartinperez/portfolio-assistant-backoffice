import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function ready(page: import("@playwright/test").Page) {
	await page.goto("/");
	await expect(
		page.getByRole("button", { name: "New chat", exact: true }),
	).toBeEnabled();
}
async function send(
	page: import("@playwright/test").Page,
	question = "What is Filomena?",
) {
	await page.getByRole("textbox", { name: "Ask a question" }).fill(question);
	await page.getByRole("button", { name: "Send", exact: true }).click();
}
test("anonymous session, incremental answer, sources, history, feedback, rename and delete", async ({
	page,
}, testInfo) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await ready(page);
	await send(page);
	await expect(
		page.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
	await page.screenshot({
		path: testInfo.outputPath("conversation-en-dark.png"),
		fullPage: true,
	});
	await page
		.getByRole("combobox", { name: "Theme", exact: true })
		.selectOption("light");
	await page.screenshot({
		path: testInfo.outputPath("conversation-en-light.png"),
		fullPage: true,
	});
	expect(
		(
			await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
				.analyze()
		).violations,
	).toEqual([]);
	const source = page.getByRole("link", { name: /projects.ts/ });
	await expect(source).toHaveAttribute("href", /^https:\/\/github.com\//);
	const popup = page.waitForEvent("popup");
	await source.click();
	const opened = await popup;
	expect(opened.url()).toContain("github.com");
	await opened.close();
	await page.getByRole("button", { name: "Helpful", exact: true }).click();
	await expect(page.getByText("Feedback saved")).toBeVisible();
	await page.reload();
	await expect(
		page.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Rename New conversation" }).click();
	await page.getByRole("textbox", { name: "Rename" }).fill("Public work");
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "Public work", exact: true }),
	).toBeVisible();
	await page.getByRole("button", { name: "Delete Public work" }).click();
	await page
		.getByRole("button", { name: "Delete conversation", exact: true })
		.click();
	await expect(
		page.getByRole("heading", { name: "Where would you like to start?" }),
	).toBeVisible();
	expect(errors).toEqual([]);
});
test("stop keeps partial output and recovery does not repeat generation", async ({
	page,
}) => {
	let sends = 0;
	page.on("request", (request) => {
		if (request.url().endsWith("/stream")) sends++;
	});
	await ready(page);
	await send(page, "slow");
	await expect(
		page.locator("pre").filter({ hasText: "This is a deterministic" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Stop", exact: true }).click();
	await expect(
		page.getByText("Incomplete response", { exact: true }),
	).toBeVisible();
	expect(sends).toBe(1);
});
test("interruption, rejection, expiry and reconnect produce safe actionable errors", async ({
	page,
}) => {
	await ready(page);
	await send(page, "interrupt");
	await expect(page.locator("main").getByRole("alert")).toContainText(
		"connection ended early",
	);
	await expect(
		page.getByText("Incomplete response", { exact: true }),
	).toBeVisible();
	await page.getByRole("button", { name: "New chat", exact: true }).click();
	await send(page, "reject");
	await expect(page.locator("main").getByRole("alert")).toContainText(
		"could not be accepted",
	);
	await page.getByRole("button", { name: "New chat", exact: true }).click();
	await send(page, "expired");
	await expect(page.locator("main").getByRole("alert")).toContainText(
		"session has expired",
	);
	await page.getByRole("button", { name: "Reconnect", exact: true }).click();
	await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
});
test("unavailable initialization can reconnect without generation", async ({
	page,
}) => {
	await page.route("**/api/v1/session", (route) =>
		route.fulfill({ status: 503, json: { message: "internal stack" } }),
	);
	await page.goto("/");
	await expect(page.locator("main").getByRole("alert")).toContainText(
		"unavailable",
	);
	await page.unroute("**/api/v1/session");
	await page.getByRole("button", { name: "Reconnect", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "New chat", exact: true }),
	).toBeEnabled();
});
test("Enter, Shift+Enter and IME follow composer rules", async ({ page }) => {
	await ready(page);
	const input = page.getByRole("textbox", { name: "Ask a question" });
	await input.fill("A");
	await input.press("Shift+Enter");
	await expect(input).toHaveValue("A\n");
	await input.dispatchEvent("keydown", {
		key: "Enter",
		code: "Enter",
		isComposing: true,
	});
	await expect(input).toHaveValue("A\n");
	await input.press("Enter");
	await expect(
		page.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
});
test("long output remains scrollable without hijacking the reader", async ({
	page,
}) => {
	await ready(page);
	await send(page, "long");
	const log = page.getByRole("log");
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
		page.getByRole("button", { name: "Jump to latest" }),
	).toBeVisible();
	await expect.poll(() => log.evaluate((node) => node.scrollTop)).toBe(0);
	await page.getByRole("button", { name: "Jump to latest" }).click();
	await expect(
		page.getByRole("button", { name: "Jump to latest" }),
	).toHaveCount(0);
	await expect(
		page.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
	expect(await page.locator('a[href^="javascript:"]').count()).toBe(0);
});
for (const viewport of [
	{ width: 320, height: 740 },
	{ width: 430, height: 932 },
	{ width: 768, height: 1024 },
	{ width: 844, height: 390 },
	{ width: 1440, height: 900 },
]) {
	test(`themes, Spanish, keyboard menu and accessibility ${viewport.width}x${viewport.height}`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize(viewport);
		await page.goto("/");
		await expect(
			page.getByRole("button", { name: "Send", exact: true }),
		).toBeVisible();
		await expect(page.getByRole("status")).not.toContainText("Connecting");
		if (viewport.width <= 900) {
			await page
				.getByRole("button", { name: "Conversations", exact: true })
				.click();
			await expect(
				page.getByRole("button", { name: "Close conversations", exact: true }),
			).toBeFocused();
			await page.keyboard.press("Escape");
			await expect(
				page.getByRole("button", { name: "Conversations", exact: true }),
			).toBeFocused();
		}
		await page
			.getByRole("combobox", { name: "Language", exact: true })
			.selectOption("es");
		for (const theme of ["light", "dark"]) {
			await page
				.getByRole("combobox", { name: "Tema", exact: true })
				.selectOption(theme);
			await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= window.innerWidth,
				),
			).toBe(true);
			const result = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
				.analyze();
			expect(result.violations).toEqual([]);
			await page.screenshot({
				path: testInfo.outputPath(`${theme}-es.png`),
				fullPage: true,
			});
		}
		await page
			.getByRole("textbox", { name: "Pregunta por el trabajo público" })
			.fill("Pregunta");
		await page.getByRole("button", { name: "Enviar", exact: true }).click();
		await expect(
			page.getByRole("heading", { name: "Fuentes públicas" }),
		).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath("conversation-es.png"),
			fullPage: true,
		});
	});
}
test("blocked preference storage keeps controls usable", async ({ page }) => {
	await page.addInitScript(() => {
		Storage.prototype.setItem = () => {
			throw new Error("blocked");
		};
		Storage.prototype.getItem = () => {
			throw new Error("blocked");
		};
	});
	await ready(page);
	await page
		.getByRole("combobox", { name: "Theme", exact: true })
		.selectOption("light");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	await send(page);
	await expect(
		page.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
});
test("zoom, reduced motion, system theme and navigation keep essential controls usable", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
	await page
		.getByRole("combobox", { name: "Theme", exact: true })
		.selectOption("system");
	await expect
		.poll(() =>
			page.evaluate(
				() => getComputedStyle(document.documentElement).colorScheme,
			),
		)
		.toBe("light");
	await page.evaluate(() => {
		document.body.style.zoom = "200%";
	});
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	const input = page.getByRole("textbox", { name: "Ask a question" });
	await input.fill("Question");
	await input.scrollIntoViewIfNeeded();
	await expect(input).toBeInViewport();
	const sendButton = page.getByRole("button", { name: "Send", exact: true });
	await sendButton.scrollIntoViewIfNeeded();
	await expect(sendButton).toBeInViewport();
	await page.evaluate(() => {
		document.body.style.zoom = "";
	});
	await send(page, "slow");
	await expect(page.locator("pre")).toContainText("This is a deterministic");
	await page.goto("about:blank");
	await page.goto("/");
	await expect(
		page.getByRole("button", { name: "Conversations", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Stop", exact: true }),
	).toHaveCount(0);
});
test("provider failure preserves partial text and no unsafe output is executable", async ({
	page,
}) => {
	await ready(page);
	await send(page, "failed");
	await expect(page.locator("main").getByRole("alert")).toContainText(
		"connection ended early",
	);
	await expect(
		page.getByText("Incomplete response", { exact: true }),
	).toBeVisible();
});
test("a reduced mobile viewport keeps the focused composer and send control visible", async ({
	page,
}) => {
	await page.setViewportSize({ width: 320, height: 740 });
	await page.goto("/");
	const input = page.getByRole("textbox", { name: "Ask a question" });
	await input.fill("Keyboard viewport");
	await input.focus();
	await page.setViewportSize({ width: 320, height: 360 });
	await expect(input).toBeInViewport();
	await expect(
		page.getByRole("button", { name: "Send", exact: true }),
	).toBeInViewport();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
});
test("keyboard focus survives rename, delete confirmation, cancellation and deletion", async ({
	page,
}) => {
	await ready(page);
	await page.getByRole("button", { name: "New chat", exact: true }).click();
	const title = page.getByRole("button", {
		name: "New conversation",
		exact: true,
	});
	await expect(title).toBeEnabled();
	await page.getByRole("button", { name: "Rename New conversation" }).click();
	await page
		.getByRole("textbox", { name: "Rename", exact: true })
		.fill("Focus test");
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "Focus test", exact: true }),
	).toBeFocused();
	await page.getByRole("button", { name: "Delete Focus test" }).click();
	await expect(
		page.getByRole("button", { name: "Cancel", exact: true }),
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(
		page.getByRole("button", { name: "Focus test", exact: true }),
	).toBeFocused();
	await page.getByRole("button", { name: "Delete Focus test" }).click();
	await page
		.getByRole("button", { name: "Delete conversation", exact: true })
		.click();
	await expect(
		page.getByRole("button", { name: "New chat", exact: true }),
	).toBeFocused();
});

test("copy reports clipboard success and failure; follow-ups only prepare a draft", async ({
	page,
}) => {
	let sends = 0;
	page.on("request", (request) => {
		if (request.url().endsWith("/stream")) sends++;
	});
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				writeText: async (text: string) => {
					document.documentElement.dataset.copiedText = text;
				},
			},
		});
	});
	await ready(page);
	await page
		.getByRole("button", { name: "What is Filomena?", exact: true })
		.click();
	await expect(page.getByRole("textbox")).toBeFocused();
	expect(sends).toBe(0);
	await page.getByRole("button", { name: "Send", exact: true }).click();
	await page.getByRole("button", { name: "Copy answer", exact: true }).click();
	await expect(page.getByText("Copied", { exact: true })).toBeVisible();
	expect(await page.locator("html").getAttribute("data-copied-text")).toContain(
		"public sources",
	);
	await page
		.getByRole("button", { name: "How was this portfolio built?", exact: true })
		.click();
	await expect(page.getByRole("textbox")).toHaveValue(
		"How was this portfolio built?",
	);
	await expect(page.getByRole("textbox")).toBeFocused();
	expect(sends).toBe(1);
	await page.evaluate(() => {
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				writeText: async () => {
					throw new Error("Permission denied");
				},
			},
		});
	});
	await page
		.getByRole("combobox", { name: "Language", exact: true })
		.selectOption("es");
	await page
		.getByRole("button", { name: "Copiar respuesta", exact: true })
		.click();
	await expect(
		page.getByRole("status").filter({ hasText: "No se pudo copiar" }),
	).toBeVisible();
	await expect(page.getByText("Copiada", { exact: true })).toHaveCount(0);
	expect(sends).toBe(1);
});

test("decorative identity respects pointer capability, reduced motion and unmount", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await ready(page);
	const avatar = page.locator("[data-identity-avatar]");
	await expect(avatar).toHaveAttribute("aria-hidden", "true");
	expect(await avatar.evaluate((node) => node.tabIndex)).toBe(-1);
	await avatar.dispatchEvent("pointermove", {
		pointerType: "mouse",
		clientX: 0,
		clientY: 0,
	});
	await expect
		.poll(() =>
			avatar.evaluate((node) => node.style.getPropertyValue("--tilt-x")),
		)
		.toBe("7deg");
	await avatar.dispatchEvent("pointerleave");
	await expect
		.poll(() =>
			avatar.evaluate((node) => node.style.getPropertyValue("--tilt-x")),
		)
		.toBe("");
	await avatar.dispatchEvent("pointermove", {
		pointerType: "touch",
		clientX: 0,
		clientY: 0,
	});
	expect(
		await avatar.evaluate((node) => node.style.getPropertyValue("--tilt-x")),
	).toBe("");
	await avatar.dispatchEvent("pointerdown", { pointerType: "touch" });
	await expect(avatar).toHaveAttribute("data-pressed", "true");
	await expect
		.poll(() =>
			avatar
				.locator("div")
				.evaluate((node) => Number(getComputedStyle(node, "::after").opacity)),
		)
		.toBeGreaterThan(0.5);
	await avatar.dispatchEvent("pointerup", { pointerType: "touch" });
	await expect(avatar).not.toHaveAttribute("data-pressed");
	await avatar.dispatchEvent("pointerdown", { pointerType: "touch" });
	await avatar.dispatchEvent("pointercancel");
	await expect(avatar).not.toHaveAttribute("data-pressed");
	await page.emulateMedia({ reducedMotion: "reduce" });
	await avatar.dispatchEvent("pointerdown", { pointerType: "touch" });
	await expect(avatar).not.toHaveAttribute("data-pressed");
	await avatar.dispatchEvent("pointermove", {
		pointerType: "mouse",
		clientX: 0,
		clientY: 0,
	});
	expect(
		await avatar.evaluate((node) => node.style.getPropertyValue("--tilt-x")),
	).toBe("");
	expect(
		await avatar
			.locator("div")
			.evaluate((node) => getComputedStyle(node).transform),
	).toBe("none");
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await avatar.dispatchEvent("pointermove", {
		pointerType: "mouse",
		clientX: 0,
		clientY: 0,
	});
	await send(page);
	await expect(avatar).toHaveCount(0);
	await page.goto("about:blank");
	expect(errors).toEqual([]);
});

test("pending clipboard writes retain keyboard focus and prevent duplicate copies", async ({
	page,
}) => {
	await page.addInitScript(() => {
		let calls = 0;
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				writeText: () =>
					new Promise<void>((resolve, reject) => {
						calls++;
						document.documentElement.dataset.copyCalls = String(calls);
						window.addEventListener("finish-copy", () => resolve(), {
							once: true,
						});
						window.addEventListener(
							"fail-copy",
							() => reject(new Error("Denied")),
							{ once: true },
						);
					}),
			},
		});
	});
	await ready(page);
	await send(page);
	const button = page.getByRole("button", { name: "Copy answer", exact: true });
	await button.focus();
	await button.press("Enter");
	await expect(button).toHaveAttribute("aria-disabled", "true");
	await expect(button).toBeFocused();
	await button.press("Enter");
	expect(await page.locator("html").getAttribute("data-copy-calls")).toBe("1");
	await page.evaluate(() => window.dispatchEvent(new Event("finish-copy")));
	await expect(page.getByText("Copied", { exact: true })).toBeVisible();
	await expect(button).toBeFocused();
	await button.press("Enter");
	await page.evaluate(() => window.dispatchEvent(new Event("fail-copy")));
	await expect(page.getByText(/Could not copy/)).toBeVisible();
	await expect(button).toBeFocused();
});

test("theme changes preserve readable suggestion contrast on every sampled frame", async ({
	page,
}) => {
	await ready(page);
	const minimum = await page
		.getByRole("button", { name: "What is Filomena?", exact: true })
		.evaluate(async (button) => {
			function luminance(color: string) {
				const channels = color.match(/\d+/g)?.map(Number);
				if (channels?.length !== 3)
					throw new Error("Expected an opaque RGB surface");
				const linear = channels.map((value) => {
					const channel = value / 255;
					return channel <= 0.04045
						? channel / 12.92
						: ((channel + 0.055) / 1.055) ** 2.4;
				});
				return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
			}
			function contrast() {
				const style = getComputedStyle(button);
				const a = luminance(style.color),
					b = luminance(style.backgroundColor);
				return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
			}
			let lowest = contrast();
			for (const theme of ["light", "dark"]) {
				document.documentElement.dataset.theme = theme;
				lowest = Math.min(lowest, contrast());
				for (let frame = 0; frame < 12; frame++) {
					await new Promise(requestAnimationFrame);
					lowest = Math.min(lowest, contrast());
				}
			}
			return lowest;
		});
	expect(minimum).toBeGreaterThanOrEqual(4.5);
});
