import type { ComponentProps } from "react";
import styles from "./button.module.css";
// Owned adaptation of the portfolio's shadcn button: native button semantics only.
export function Button({
	variant = "outline",
	size = "default",
	className = "",
	type = "button",
	...props
}: ComponentProps<"button"> & {
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "icon";
}) {
	return (
		<button
			type={type}
			data-slot="button"
			className={`${styles.button} ${styles[variant]} ${size === "icon" ? styles.icon : ""} ${className}`}
			{...props}
		/>
	);
}
