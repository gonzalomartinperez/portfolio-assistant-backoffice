import { SignIn } from "../../features/auth/sign-in.tsx";
import { authCopy, authLocale } from "../../features/auth/copy.ts";
import { getAuthLocale, readiness } from "../../features/auth/server.ts";
import styles from "../../features/auth/auth.module.css";
export const metadata = {
	title: "Sign in — Assistant backoffice",
	robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const locale = params.locale
		? authLocale(params.locale)
		: await getAuthLocale();
	const available = await readiness();
	const copy = authCopy[locale];
	return (
		<main id="main" lang={locale} className={styles.main}>
			<SignIn locale={locale} unavailable={!available} />
			{!available ? (
				<p className={styles.notice} role="status">
					{copy.unavailable}
				</p>
			) : (
				params.error && (
					<p className={styles.error} role="alert">
						{copy.denied}
					</p>
				)
			)}
		</main>
	);
}
