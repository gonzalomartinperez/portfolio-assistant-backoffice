import test from "node:test";
import assert from "node:assert/strict";
import { parseHostMessage } from "../../src/features/embed/protocol.ts";
import { parseEmbedOrigins } from "../../src/shared/config/embed-origins.ts";
test("embed protocol accepts only bounded v1 payloads", () => {
	const valid = {
		version: 1,
		type: "host.initialize",
		preferences: { theme: "light", locale: "es" },
		visible: true,
	};
	assert.deepEqual(parseHostMessage(valid), valid);
	for (const bad of [
		null,
		[],
		"host.focus",
		{ ...valid, version: 2 },
		{ ...valid, token: "not-allowed" },
		{ ...valid, visible: "true" },
		{ ...valid, preferences: { theme: "system", locale: "es" } },
		{ version: 1, type: "host.navigate", url: "https://example.com" },
	])
		assert.equal(parseHostMessage(bad), null);
	assert.deepEqual(parseHostMessage({ version: 1, type: "host.focus" }), {
		version: 1,
		type: "host.focus",
	});
});
test("frame origin configuration rejects wildcards, paths and unsafe origins without echoing values", () => {
	assert.deepEqual(parseEmbedOrigins(undefined), [
		"https://gonzalomartinperez.com",
	]);
	assert.deepEqual(
		parseEmbedOrigins("http://localhost:3110,https://gonzalomartinperez.com"),
		["http://localhost:3110", "https://gonzalomartinperez.com"],
	);
	for (const bad of [
		"*",
		"https://*.example.com",
		"https://*",
		"null",
		"https://example.com/path",
		"https://user:secret@example.com",
		"http://example.com",
		"",
		"https://example.com\nhttps://other.com",
	])
		assert.throws(() => parseEmbedOrigins(bad), {
			message: "Invalid EMBED_ALLOWED_ORIGINS",
		});
});
