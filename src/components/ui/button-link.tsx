import type { ComponentProps } from "react";
import styles from "./button.module.css";

export function ButtonLink({
	variant = "outline",
	className = "",
	...props
}: ComponentProps<"a"> & { variant?: "default" | "outline" | "ghost" }) {
	return (
		<a
			className={`${styles.button} ${styles[variant]} ${className}`}
			{...props}
		/>
	);
}
