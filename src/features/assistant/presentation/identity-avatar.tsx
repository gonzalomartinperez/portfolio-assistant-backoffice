"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./identity-avatar.module.css";

export function IdentityAvatar() {
	const host = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const node = host.current;
		if (!node) return;
		const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
		let frame = 0;
		let x = 0;
		let y = 0;
		function release() {
			node?.removeAttribute("data-pressed");
		}
		function press() {
			if (!reduced.matches) node?.setAttribute("data-pressed", "true");
		}
		function reset() {
			release();
			cancelAnimationFrame(frame);
			frame = 0;
			node?.style.removeProperty("--tilt-x");
			node?.style.removeProperty("--tilt-y");
		}
		function move(event: PointerEvent) {
			if (!pointer.matches || reduced.matches || event.pointerType !== "mouse")
				return;
			const rect = node?.getBoundingClientRect();
			if (!rect) return;
			x = Math.max(
				-1,
				Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
			);
			y = Math.max(
				-1,
				Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
			);
			if (frame) return;
			frame = requestAnimationFrame(() => {
				node?.style.setProperty("--tilt-x", `${-y * 7}deg`);
				node?.style.setProperty("--tilt-y", `${x * 7}deg`);
				frame = 0;
			});
		}
		node.addEventListener("pointerdown", press, { passive: true });
		window.addEventListener("pointerup", release, { passive: true });
		node.addEventListener("pointermove", move);
		node.addEventListener("pointerleave", reset);
		node.addEventListener("pointercancel", reset);
		pointer.addEventListener("change", reset);
		reduced.addEventListener("change", reset);
		window.addEventListener("blur", reset);
		return () => {
			reset();
			node.removeEventListener("pointerdown", press);
			window.removeEventListener("pointerup", release);
			node.removeEventListener("pointermove", move);
			node.removeEventListener("pointerleave", reset);
			node.removeEventListener("pointercancel", reset);
			pointer.removeEventListener("change", reset);
			reduced.removeEventListener("change", reset);
			window.removeEventListener("blur", reset);
		};
	}, []);
	return (
		<div
			ref={host}
			className={styles.identity}
			aria-hidden="true"
			data-identity-avatar
		>
			<div className={styles.disc}>
				<Image src="/avatar.png" width={88} height={88} alt="" preload />
			</div>
		</div>
	);
}
