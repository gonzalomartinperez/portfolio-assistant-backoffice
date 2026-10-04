import "server-only";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAuthConfiguration } from "./config.ts";
import { createAuthRuntime } from "./runtime.ts";
import { authLocale } from "./copy.ts";
import type { Access } from "./store.ts";
let runtime: ReturnType<typeof createAuthRuntime> | undefined;
export function getAuthRuntime() {
	runtime ??= createAuthRuntime(readAuthConfiguration(process.env));
	return runtime;
}
export async function getAccess(): Promise<Access | null> {
	const { auth, store } = getAuthRuntime();
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user.emailVerified) return null;
	return store.access({
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
	});
}
export async function requireAccess(): Promise<Access> {
	let access: Access | null;
	try {
		access = await getAccess();
	} catch {
		redirect("/sign-in?error=unavailable");
	}
	if (!access) redirect("/sign-in");
	return access;
}
export async function requireOwner(): Promise<Access> {
	const access = await requireAccess();
	if (access.role !== "owner") redirect("/");
	return access;
}

export async function readiness(): Promise<boolean> {
	try {
		const { pool } = getAuthRuntime();
		const result = await pool.query('SELECT id FROM "user" LIMIT 0');
		await pool.query(
			"SELECT user_id,role,revoked_at FROM backoffice_member LIMIT 0",
		);
		await pool.query("SELECT id,token FROM session LIMIT 0");
		return result.rowCount === 0;
	} catch {
		return false;
	}
}

export async function getAuthLocale() {
	return authLocale((await cookies()).get("backoffice-locale")?.value);
}
