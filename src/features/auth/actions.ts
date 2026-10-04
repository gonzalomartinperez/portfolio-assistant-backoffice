"use server";
import { revalidatePath } from "next/cache";
import { validEmail } from "./config.ts";
import { requireOwner, getAuthRuntime } from "./server.ts";
export interface InviteResult {
	link: string | null;
	error: string | null;
}
export async function inviteUser(
	_previous: InviteResult,
	data: FormData,
): Promise<InviteResult> {
	const actor = await requireOwner();
	const email = data.get("email");
	if (typeof email !== "string" || !validEmail(email.trim()))
		return { link: null, error: "Enter a valid email address." };
	try {
		const token = await getAuthRuntime().store.invite(
			actor.user.id,
			email.trim(),
		);
		const origin = getAuthRuntime().options.baseURL;
		revalidatePath("/access");
		return { link: `${origin}/access/invitation?token=${token}`, error: null };
	} catch {
		return {
			link: null,
			error: "The invitation could not be created. Try again.",
		};
	}
}
export async function revokeAccess(data: FormData): Promise<void> {
	const actor = await requireOwner();
	const id = data.get("id");
	const kind = data.get("kind");
	if (
		typeof id !== "string" ||
		id.length > 128 ||
		(kind !== "member" && kind !== "invitation")
	)
		throw new Error("Invalid access request");
	await getAuthRuntime().store.revoke(actor.user.id, id, kind);
	revalidatePath("/access");
}
