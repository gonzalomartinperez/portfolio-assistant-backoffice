import assert from "node:assert/strict";
import test from "node:test";
import {
	inviteViewer,
	revokeViewerAccess,
	type AccessManagementPort,
} from "../../src/features/auth/application/manage-access.ts";
import type { Access } from "../../src/features/auth/domain/access.ts";

const owner: Access = {
	user: { id: "owner-id", name: "Owner", email: "owner@example.test" },
	role: "owner",
};

function fixture() {
	const writes: unknown[][] = [];
	const port: AccessManagementPort = {
		async invite(...args) {
			writes.push(args);
			return "opaque-token";
		},
		async revoke(...args) {
			writes.push(args);
		},
	};
	return { writes, port };
}

test("access use cases reject viewers and malformed inputs before persistence", async () => {
	const { port, writes } = fixture();
	const viewer: Access = { ...owner, role: "viewer" };
	assert.deepEqual(await inviteViewer(viewer, "new@example.test", port), {
		status: "rejected",
		reason: "forbidden",
	});
	assert.deepEqual(await revokeViewerAccess(viewer, "member", "member", port), {
		status: "rejected",
		reason: "forbidden",
	});
	for (const email of [null, {}, "bad", "bad\n@example.test", "a".repeat(255)])
		assert.deepEqual(await inviteViewer(owner, email, port), {
			status: "rejected",
			reason: "invalid-email",
		});
	for (const [id, kind] of [
		["", "member"],
		[" ", "member"],
		[null, "member"],
		["a".repeat(129), "member"],
		["id", "owner"],
	])
		assert.deepEqual(await revokeViewerAccess(owner, id, kind, port), {
			status: "rejected",
			reason: "invalid-target",
		});
	assert.deepEqual(writes, []);
});

test("owner use cases normalize email and delegate the actor for transactional reauthorization", async () => {
	const { port, writes } = fixture();
	assert.deepEqual(await inviteViewer(owner, " Viewer@Example.test ", port), {
		status: "created",
		token: "opaque-token",
	});
	for (const kind of ["member", "invitation"])
		assert.deepEqual(await revokeViewerAccess(owner, "target", kind, port), {
			status: "revoked",
		});
	assert.deepEqual(writes, [
		["owner-id", "viewer@example.test"],
		["owner-id", "target", "member"],
		["owner-id", "target", "invitation"],
	]);
});

test("revoked owners and persistence failures produce bounded failures without leaking diagnostics", async () => {
	const fail = async () => {
		throw new Error("private database credentials");
	};
	const port: AccessManagementPort = { invite: fail, revoke: fail };
	assert.deepEqual(await inviteViewer(owner, "viewer@example.test", port), {
		status: "rejected",
		reason: "unavailable",
	});
	assert.deepEqual(await revokeViewerAccess(owner, "target", "member", port), {
		status: "rejected",
		reason: "unavailable",
	});
});
