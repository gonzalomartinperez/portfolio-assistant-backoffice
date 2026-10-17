export interface AccessUser {
	id: string;
	name: string;
	email: string;
}

export interface Access {
	user: AccessUser;
	role: "owner" | "viewer";
}

export type RevocationKind = "member" | "invitation";

export function validEmail(value: string): boolean {
	return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
