import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Pool } from "pg";

export interface AccessUser {
	id: string;
	name: string;
	email: string;
}
export interface Access {
	user: AccessUser;
	role: "owner" | "viewer";
}
const digest = (token: string) =>
	createHash("sha256").update(token).digest("hex");

export function createAccessStore(pool: Pool, ownerEmail: string) {
	return {
		async mayRegister(
			email: string,
			verified: boolean,
			token: string | null,
		): Promise<boolean> {
			if (!verified) return false;
			if (email.toLowerCase() === ownerEmail) return true;
			if (!token) return false;
			const result = await pool.query(
				"SELECT id FROM backoffice_invitation WHERE token_hash=$1 AND email=$2 AND expires_at>now() AND consumed_at IS NULL AND revoked_at IS NULL",
				[digest(token), email.toLowerCase()],
			);
			return result.rowCount === 1;
		},
		async admit(userId: string, token: string | null): Promise<boolean> {
			const client = await pool.connect();
			try {
				await client.query("BEGIN");
				const user = await client.query<{
					email: string;
					emailVerified: boolean;
				}>('SELECT email, "emailVerified" FROM "user" WHERE id=$1 FOR UPDATE', [
					userId,
				]);
				const identity = user.rows[0];
				if (!identity?.emailVerified) {
					await client.query("ROLLBACK");
					return false;
				}
				const existing = await client.query<{
					role: string;
					revoked_at: Date | null;
				}>("SELECT role, revoked_at FROM backoffice_member WHERE user_id=$1", [
					userId,
				]);
				if (existing.rows[0] && !existing.rows[0].revoked_at) {
					await client.query("COMMIT");
					return true;
				}
				const isOwner = identity.email.toLowerCase() === ownerEmail;
				if (!isOwner) {
					if (!token) {
						await client.query("ROLLBACK");
						return false;
					}
					const invite = await client.query(
						"UPDATE backoffice_invitation SET consumed_at=now() WHERE token_hash=$1 AND email=$2 AND expires_at>now() AND consumed_at IS NULL AND revoked_at IS NULL RETURNING id",
						[digest(token), identity.email.toLowerCase()],
					);
					if (invite.rowCount !== 1) {
						await client.query("ROLLBACK");
						return false;
					}
				}
				await client.query(
					"INSERT INTO backoffice_member(user_id,role) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET role=EXCLUDED.role,revoked_at=NULL",
					[userId, isOwner ? "owner" : "viewer"],
				);
				await client.query("COMMIT");
				return true;
			} catch (error) {
				await client.query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		},
		async access(user: AccessUser): Promise<Access | null> {
			const result = await pool.query<{ role: unknown }>(
				"SELECT role FROM backoffice_member WHERE user_id=$1 AND revoked_at IS NULL",
				[user.id],
			);
			const role = result.rows[0]?.role;
			return role === "owner" || role === "viewer" ? { user, role } : null;
		},
		async invite(actorId: string, email: string): Promise<string> {
			const token = randomBytes(32).toString("hex");
			const id = randomUUID();
			const client = await pool.connect();
			try {
				await client.query("BEGIN");
				const actor = await client.query(
					"SELECT user_id FROM backoffice_member WHERE user_id=$1 AND role='owner' AND revoked_at IS NULL FOR UPDATE",
					[actorId],
				);
				if (actor.rowCount !== 1) throw new Error("Access denied");
				await client.query(
					"INSERT INTO backoffice_invitation(id,email,token_hash,created_by,expires_at) VALUES($1,$2,$3,$4,now()+interval '48 hours')",
					[id, email.toLowerCase(), digest(token), actorId],
				);
				await client.query(
					"INSERT INTO backoffice_access_audit(actor_id,action,subject_id) VALUES($1,'invite',$2)",
					[actorId, id],
				);
				await client.query("COMMIT");
				return token;
			} catch (error) {
				await client.query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		},
		async revoke(
			actorId: string,
			subjectId: string,
			kind: "member" | "invitation",
		): Promise<void> {
			const client = await pool.connect();
			try {
				await client.query("BEGIN");
				const actor = await client.query(
					"SELECT user_id FROM backoffice_member WHERE user_id=$1 AND role='owner' AND revoked_at IS NULL FOR UPDATE",
					[actorId],
				);
				if (actor.rowCount !== 1) throw new Error("Access denied");
				if (kind === "member") {
					const result = await client.query(
						"UPDATE backoffice_member SET revoked_at=now() WHERE user_id=$1 AND role='viewer' RETURNING user_id",
						[subjectId],
					);
					if (result.rowCount !== 1)
						throw new Error("Member cannot be revoked");
					await client.query('DELETE FROM session WHERE "userId"=$1', [
						subjectId,
					]);
				} else {
					await client.query(
						"UPDATE backoffice_invitation SET revoked_at=now() WHERE id=$1",
						[subjectId],
					);
				}
				await client.query(
					"INSERT INTO backoffice_access_audit(actor_id,action,subject_id) VALUES($1,$2,$3)",
					[
						actorId,
						kind === "member" ? "revoke-member" : "revoke-invitation",
						subjectId,
					],
				);
				await client.query("COMMIT");
			} catch (error) {
				await client.query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		},
		async list() {
			const [members, invitations] = await Promise.all([
				pool.query<{
					id: string;
					email: string;
					role: string;
					revoked_at: Date | null;
				}>(
					'SELECT u.id,u.email,m.role,m.revoked_at FROM backoffice_member m JOIN "user" u ON u.id=m.user_id ORDER BY m.created_at',
				),
				pool.query<{
					id: string;
					email: string;
					expires_at: Date;
					consumed_at: Date | null;
					revoked_at: Date | null;
				}>(
					"SELECT id,email,expires_at,consumed_at,revoked_at FROM backoffice_invitation ORDER BY created_at DESC LIMIT 100",
				),
			]);
			return { members: members.rows, invitations: invitations.rows };
		},
	};
}
