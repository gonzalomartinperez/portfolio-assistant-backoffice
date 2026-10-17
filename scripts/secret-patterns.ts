const rules: ReadonlyArray<readonly [string, RegExp]> = [
	["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
	["provider-token", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/],
	[
		"github-token",
		/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/,
	],
	["cloud-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
	[
		"public-secret-config",
		/NEXT_PUBLIC_[A-Z_]*(?:SECRET|PASSWORD|PRIVATE_KEY|API_KEY)/,
	],
];

export function secretDetectors(text: string): string[] {
	return rules
		.filter(([, pattern]) => pattern.test(text))
		.map(([name]) => name);
}
