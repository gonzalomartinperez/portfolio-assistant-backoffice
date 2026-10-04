import { requireOwner, getAuthRuntime } from "../../features/auth/server.ts";
import { InviteForm } from "../../features/auth/invite-form.tsx";
import { LinkAccount } from "../../features/auth/link-account.tsx";
import { revokeAccess } from "../../features/auth/actions.ts";
export const dynamic = "force-dynamic";
export const metadata = {
	title: "Access — Assistant backoffice",
	robots: { index: false, follow: false },
};
export default async function AccessPage() {
	await requireOwner();
	const { members, invitations } = await getAuthRuntime().store.list();
	return (
		<main>
			<a href="/">Back to overview</a>
			<h1>Access management</h1>
			<InviteForm />
			<LinkAccount />
			<h2>Members</h2>
			<ul>
				{members.map((member) => (
					<li key={member.id}>
						{member.email} · {member.role}
						{member.revoked_at
							? " · Revoked"
							: member.role === "viewer" && (
									<form action={revokeAccess}>
										<input type="hidden" name="id" value={member.id} />
										<input type="hidden" name="kind" value="member" />
										<button type="submit">
											Revoke access for {member.email}
										</button>
									</form>
								)}
					</li>
				))}
			</ul>
			<h2>Invitations</h2>
			<ul>
				{invitations.map((invite) => (
					<li key={invite.id}>
						{invite.email} ·{" "}
						{invite.consumed_at ? (
							"Used"
						) : invite.revoked_at ? (
							"Revoked"
						) : invite.expires_at.getTime() < Date.now() ? (
							"Expired"
						) : (
							<form action={revokeAccess}>
								<input type="hidden" name="id" value={invite.id} />
								<input type="hidden" name="kind" value="invitation" />
								<button type="submit">
									Revoke invitation for {invite.email}
								</button>
							</form>
						)}
					</li>
				))}
			</ul>
		</main>
	);
}
