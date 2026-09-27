import styles from "./chat.module.css";
export function cx(names: string) {
	return names
		.split(/\s+/)
		.map((name) => styles[name] ?? name)
		.join(" ");
}
