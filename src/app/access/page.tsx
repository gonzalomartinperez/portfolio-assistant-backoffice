import {
	requireOwner,
	getAuthRuntime,
	getAuthLocale,
} from "../../features/auth/server.ts";
import { InviteForm } from "../../features/auth/invite-form.tsx";
import { LinkAccount } from "../../features/auth/link-account.tsx";
import { RevokeControl } from "../../features/auth/revoke-control.tsx";
import { authLocale, authCopy } from "../../features/auth/copy.ts";
import styles from "../../features/auth/auth.module.css";
export const dynamic = "force-dynamic";
export const metadata = {
	title: "Access — Assistant backoffice",
	robots: { index: false, follow: false },
};
export default async function AccessPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const locale = params.locale
		? authLocale(params.locale)
		: await getAuthLocale();
	const copy = authCopy[locale];
	await requireOwner();
	let data: Awaited<
		ReturnType<ReturnType<typeof getAuthRuntime>["store"]["list"]>
	>;
	try {
		data = await getAuthRuntime().store.list();
	} catch {
		return (
			<main id="main" lang={locale} className={styles.main}>
				<h1>{copy.access}</h1>
				<p role="status">{copy.unavailable}</p>
				<a className={styles.link} href={`/?locale=${locale}`}>
					{copy.back}
				</a>
			</main>
		);
	}
	return (
		<main id="main" lang={locale} className={`${styles.main} ${styles.stack}`}>
			<a className={styles.link} href={`/?locale=${locale}`}>
				{copy.back}
			</a>
			<h1>{copy.access}</h1>
			<InviteForm locale={locale} />
			<LinkAccount locale={locale} />
			<section aria-labelledby="members-title">
				<h2 id="members-title" tabIndex={-1}>
					{copy.members}
				</h2>
				<ul className={styles.list}>
					{data.members.map((member) => (
						<li className={styles.row} key={member.id}>
							<span>
								{member.email} ·{" "}
								{member.role === "owner" ? copy.owner : copy.viewer}
								{member.revoked_at ? ` · ${copy.revoked}` : ""}
							</span>
							{!member.revoked_at && member.role === "viewer" && (
								<RevokeControl
									id={member.id}
									kind="member"
									subject={member.email}
									locale={locale}
								/>
							)}
						</li>
					))}
				</ul>
			</section>
			<section aria-labelledby="invitations-title">
				<h2 id="invitations-title" tabIndex={-1}>
					{copy.invitations}
				</h2>
				<ul className={styles.list}>
					{data.invitations.map((invite) => (
						<li className={styles.row} key={invite.id}>
							<span>
								{invite.email} ·{" "}
								{invite.consumed_at
									? copy.used
									: invite.revoked_at
										? copy.revoked
										: invite.expires_at.getTime() < Date.now()
											? copy.expired
											: copy.pending}
							</span>
							{!invite.consumed_at &&
								!invite.revoked_at &&
								invite.expires_at.getTime() >= Date.now() && (
									<RevokeControl
										id={invite.id}
										kind="invitation"
										subject={invite.email}
										locale={locale}
									/>
								)}
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
