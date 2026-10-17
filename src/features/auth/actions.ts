"use server";
import { revalidatePath } from "next/cache";
import { authLocale } from "./copy.ts";
import {
	inviteViewer,
	revokeViewerAccess,
} from "./application/manage-access.ts";
import { requireOwner, getAuthRuntime } from "./server.ts";
export interface InviteResult {
	link: string | null;
	error: "invalid-email" | "unavailable" | null;
}
export async function inviteUser(
	_previous: InviteResult,
	data: FormData,
): Promise<InviteResult> {
	const actor = await requireOwner();
	const runtime = getAuthRuntime();
	const result = await inviteViewer(actor, data.get("email"), runtime.store);
	if (result.status === "rejected") {
		return {
			link: null,
			error:
				result.reason === "invalid-email" ? "invalid-email" : "unavailable",
		};
	}
	revalidatePath("/access");
	return {
		link: `${runtime.options.baseURL}/access/invitation?token=${result.token}&locale=${authLocale(data.get("locale"))}`,
		error: null,
	};
}
export async function revokeAccess(data: FormData): Promise<void> {
	const actor = await requireOwner();
	const result = await revokeViewerAccess(
		actor,
		data.get("id"),
		data.get("kind"),
		getAuthRuntime().store,
	);
	if (result.status === "rejected")
		throw new Error("Access request could not be completed");
	revalidatePath("/access");
}
