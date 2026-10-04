import { SignIn } from "../../features/auth/sign-in.tsx";
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
	return (
		<main>
			<SignIn />
			{params.error && (
				<p role="alert">
					This account could not be admitted. Use your invited, verified account
					or contact the owner.
				</p>
			)}
		</main>
	);
}
