import { ButtonLink } from "../../components/ui/button-link";
import styles from "../../features/auth/auth.module.css";
export const metadata = {
	title: "Privacy / Privacidad — Portfolio backoffice",
	robots: { index: false, follow: false },
};
const en = {
	title: "Privacy and data",
	back: "Back to sign in",
	intro:
		"This is Gonzalo Martín Pérez’s private portfolio-operations backoffice. Access is limited to the owner and invited viewers; this is not the public chat.",
	accessTitle: "Account and essential storage",
	access:
		"Google or GitHub authenticates your account. The application stores verified email, name, provider/account identifiers, membership and invitation/access audit records in its authentication database. OAuth tokens are encrypted at rest by the application. Better Auth session records may contain network address and browser information for authentication; these are separate from product analytics.",
	cookies:
		"Host-scoped, HttpOnly session cookies support sign-in. Sessions expire after eight hours and may renew while active. OAuth state cookies support the sign-in flow. Theme is saved locally; the selected language uses a preference cookie. There are no advertising or session-replay tools. Signing out ends the active session; it does not erase membership or audit records.",
	metricsTitle: "Metrics and third parties",
	metrics:
		"Product analytics is disabled by default. If separately approved and enabled, it reports bounded portfolio interactions without visitor identifiers or raw conversation content: per-event random IDs expire after 24 hours; daily aggregates cover seven UTC days. Country remains unknown. Network processing and infrastructure logs are separate from these aggregates.",
	ai: "This backoffice does not send prompts to an AI model. The separate public assistant uses OpenAI, when enabled, for questions, approved public evidence and relevant conversation context; embeddings also process queries. Store=false is not a provider zero-retention guarantee. API conversation retention defaults to seven days, configurable from one to 30; deletion cleanup and backups have separate limits. No production activation is announced here.",
	rightsTitle: "Access, questions and limitations",
	rights:
		"Ask the maintainer through the portfolio’s contact page about access, correction or deletion. Revocation blocks further access; it is not a claim that every audit record or backup is immediately erased. Authentication audit retention, backup expiry, hosting region and applicable legal requirements must be confirmed before production. This notice does not claim a legal certification or a cookieless exemption.",
	contact: "Contact the maintainer",
};
const es: typeof en = {
	title: "Privacidad y datos",
	back: "Volver al inicio de sesión",
	intro:
		"Este es el backoffice privado de operaciones del portfolio de Gonzalo Martín Pérez. El acceso está limitado al propietario y a las personas invitadas; no es el chat público.",
	accessTitle: "Cuenta y almacenamiento esencial",
	access:
		"Google o GitHub autentica tu cuenta. La aplicación guarda correo verificado, nombre, identificadores de cuenta y proveedor, permisos e historial de invitaciones y acceso en su base de autenticación. La aplicación cifra los tokens OAuth almacenados. Los registros de sesión de Better Auth pueden incluir dirección de red e información del navegador para la autenticación; son independientes de las métricas de producto.",
	cookies:
		"Las cookies de sesión HttpOnly, limitadas al host, permiten iniciar sesión. Las sesiones vencen a las ocho horas y pueden renovarse durante el uso. Las cookies de estado OAuth permiten completar el acceso. El tema se guarda localmente; el idioma elegido usa una cookie de preferencia. No hay herramientas publicitarias ni de grabación de sesiones. Cerrar sesión termina la sesión activa; no elimina permisos ni registros de auditoría.",
	metricsTitle: "Métricas y terceros",
	metrics:
		"Las métricas de producto están desactivadas por defecto. Si se aprueban y activan por separado, muestran interacciones limitadas del portfolio sin identificadores de visitantes ni conversaciones: los identificadores aleatorios de cada evento vencen a las 24 horas; los agregados diarios abarcan siete días UTC. El país permanece desconocido. El procesamiento de red y los registros de infraestructura son independientes de estos agregados.",
	ai: "Este backoffice no envía consultas a un modelo de IA. El asistente público independiente usa OpenAI, cuando está habilitado, para consultas, evidencia pública aprobada y contexto pertinente de la conversación; las representaciones vectoriales también procesan las consultas. Store=false no garantiza que el proveedor no retenga datos. La API conserva conversaciones siete días por defecto, configurable de uno a 30; la limpieza tras el borrado y los respaldos tienen límites independientes. Este aviso no anuncia una activación en producción.",
	rightsTitle: "Acceso, consultas y límites",
	rights:
		"Comunícate con el responsable mediante la página de contacto del portfolio para consultar por acceso, corrección o eliminación. Revocar permisos impide nuevos accesos; no significa que todos los registros de auditoría y respaldos se borren de inmediato. La retención de auditoría, el vencimiento de respaldos, la región de alojamiento y las obligaciones legales aplicables deben confirmarse antes de producción. Este aviso no afirma certificaciones legales ni una exención por no usar cookies de seguimiento.",
	contact: "Contactar al responsable",
};
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const locale = (await searchParams).locale === "es" ? "es" : "en";
	const t = locale === "es" ? es : en;
	return (
		<main id="main" lang={locale} className={styles.main}>
			<article className={`${styles.card} ${styles.stack}`}>
				<h1>{t.title}</h1>
				<p>{t.intro}</p>
				<nav
					className={styles.actions}
					aria-label={locale === "es" ? "Idioma" : "Language"}
				>
					<a
						href="/privacy?locale=en"
						hrefLang="en"
						aria-current={locale === "en" ? "page" : undefined}
					>
						English
					</a>
					<a
						href="/privacy?locale=es"
						hrefLang="es"
						aria-current={locale === "es" ? "page" : undefined}
					>
						Español
					</a>
				</nav>
				<h2>{t.accessTitle}</h2>
				<p>{t.access}</p>
				<p>{t.cookies}</p>
				<h2>{t.metricsTitle}</h2>
				<p>{t.metrics}</p>
				<p>{t.ai}</p>
				<h2>{t.rightsTitle}</h2>
				<p>{t.rights}</p>
				<a
					href={`https://gonzalomartinperez.com/${locale === "es" ? "es/" : ""}contact`}
				>
					{t.contact}
				</a>
				<ButtonLink href={`/sign-in?locale=${locale}`}>{t.back}</ButtonLink>
			</article>
		</main>
	);
}
