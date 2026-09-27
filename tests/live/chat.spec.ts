import { expect, test } from "@playwright/test";

test("streams cited fixture answers and restores anonymous history", async ({
	page,
}) => {
	await page.goto("/");
	await expect(page.getByRole("button", { name: "New chat" })).toBeEnabled();
	await page
		.getByRole("textbox", { name: "Ask a question" })
		.fill("What is Filomena?");
	await page.getByRole("button", { name: "Send", exact: true }).click();
	await expect(
		page.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: /projects\.ts/ }).first(),
	).toHaveAttribute(
		"href",
		/github\.com\/gonzalomartinperez\/portfolio\/blob\/[0-9a-f]{40}/,
	);
	await page.reload();
	await expect(page.getByText("What is Filomena?")).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Public sources" }),
	).toBeVisible();
});

test("Spanish mobile chat has no horizontal overflow", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	await page.getByRole("button", { name: "Conversations" }).click();
	await expect(page.getByRole("button", { name: "New chat" })).toBeEnabled();
	await page.getByRole("button", { name: "Close conversations" }).click();
	await page.getByLabel("Language").selectOption("es");
	await page
		.getByRole("textbox", { name: "Pregunta por el trabajo público" })
		.fill("¿Qué es Filomena?");
	await page.getByRole("button", { name: "Enviar", exact: true }).click();
	await expect(
		page.getByRole("heading", { name: "Fuentes públicas" }),
	).toBeVisible();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).toBe(true);
});

test("theme controls and 200 percent mobile zoom remain usable", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	const theme = page.getByLabel("Theme");
	await theme.selectOption("dark");
	await expect
		.poll(() =>
			page.evaluate(
				() => getComputedStyle(document.documentElement).colorScheme,
			),
		)
		.toBe("dark");
	await theme.selectOption("light");
	await expect
		.poll(() =>
			page.evaluate(
				() => getComputedStyle(document.documentElement).colorScheme,
			),
		)
		.toBe("light");
	await page.emulateMedia({ colorScheme: "dark" });
	await theme.selectOption("system");
	await expect
		.poll(() =>
			page.evaluate(
				() => getComputedStyle(document.documentElement).colorScheme,
			),
		)
		.toBe("dark");
	await page.evaluate(() => {
		document.body.style.zoom = "200%";
	});
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	await page.getByRole("button", { name: "Conversations" }).click();
	await expect(page.getByRole("button", { name: "New chat" })).toBeEnabled();
});

test("mobile conversation drawer restores focus and theme survives reload", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	const menu = page.getByRole("button", { name: "Conversations" });
	await menu.click();
	await expect(
		page.getByRole("dialog", { name: "Conversations" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Close conversations" }),
	).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(menu).toBeFocused();
	await page.getByLabel("Theme").selectOption("light");
	await page.reload();
	await expect
		.poll(() => page.evaluate(() => document.documentElement.dataset.theme))
		.toBe("light");
});
