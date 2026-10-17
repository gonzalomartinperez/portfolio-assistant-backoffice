import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { record, text } from "./json.ts";
const source = record(
	JSON.parse(readFileSync("contracts/source.json", "utf8")),
);
for (const [file, expected] of [
	["openapi.json", text(source.openapi_sha256)],
	["sse.schema.json", text(source.sse_sha256)],
	["sse.examples.json", text(source.sse_examples_sha256)],
]) {
	const actual = createHash("sha256")
		.update(readFileSync(`contracts/${file}`))
		.digest("hex");
	if (actual !== expected)
		throw new Error(
			`${file} differs from API commit ${text(source.api_commit)}`,
		);
}
console.log(
	`Historical public contract matches API ${text(source.api_commit)}`,
);

const operations = record(
	JSON.parse(readFileSync("contracts/operations.source.json", "utf8")),
);
for (const file of ["operations.schema.json", "operations.example.json"]) {
	const expected = text(operations[`${file.replaceAll(".", "_")}_sha256`]);
	const actual = createHash("sha256")
		.update(readFileSync(`contracts/${file}`))
		.digest("hex");
	if (actual !== expected)
		throw new Error(
			`${file} differs from operations API ${text(operations.api_commit)}`,
		);
}
console.log(
	`Private operations contract matches API ${text(operations.api_commit)}`,
);

const product = record(
	JSON.parse(readFileSync("contracts/product-analytics.source.json", "utf8")),
);
const productHash = createHash("sha256")
	.update(readFileSync("contracts/product-analytics.schema.json"))
	.digest("hex");
if (productHash !== text(product.schema_sha256))
	throw new Error("Product schema differs from pinned API");
const copied = record(
	JSON.parse(readFileSync("contracts/product-analytics.schema.json", "utf8")),
);
const { $defs, ...root } = copied;
const expectedWrapper = JSON.parse(
	JSON.stringify({
		openapi: "3.1.0",
		info: { title: "Private product analytics", version: "1" },
		paths: {},
		components: { schemas: { ...record($defs), ProductSnapshot: root } },
	}).replaceAll("#/$defs/", "#/components/schemas/"),
);
if (
	JSON.stringify(
		JSON.parse(
			readFileSync("contracts/product-analytics.openapi.json", "utf8"),
		),
	) !== JSON.stringify(expectedWrapper)
)
	throw new Error("Product OpenAPI wrapper drift");
console.log(`Product contract matches API ${text(product.api_commit)}`);

const feedback = record(
	JSON.parse(readFileSync("contracts/feedback.source.json", "utf8")),
);
const feedbackBytes = readFileSync("contracts/feedback.schema.json");
if (
	createHash("sha256").update(feedbackBytes).digest("hex") !==
	text(feedback.schema_sha256)
)
	throw new Error("Feedback schema differs from pinned API");
const feedbackWrapper = {
	openapi: "3.1.0",
	info: { title: "Private feedback summary", version: "1" },
	paths: {},
	components: {
		schemas: { FeedbackView: JSON.parse(feedbackBytes.toString()) },
	},
};
if (
	JSON.stringify(
		JSON.parse(readFileSync("contracts/feedback.openapi.json", "utf8")),
	) !== JSON.stringify(feedbackWrapper)
)
	throw new Error("Feedback OpenAPI wrapper drift");
console.log(`Feedback contract matches API ${text(feedback.api_commit)}`);
