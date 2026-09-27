"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { copy, type Locale } from "../../../shared/i18n/copy";
import { cx } from "./styles";

type CopyState = "ready" | "copying" | "copied" | "failed";

export function CopyAnswer({
	content,
	locale,
}: {
	content: string;
	locale: Locale;
}) {
	const [state, setState] = useState<CopyState>("ready");
	const pending = useRef(false);
	const mounted = useRef(false);
	const t = copy[locale];
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	async function copyAnswer() {
		if (pending.current) return;
		pending.current = true;
		setState("copying");
		try {
			await navigator.clipboard.writeText(content);
			if (mounted.current) setState("copied");
		} catch {
			if (mounted.current) setState("failed");
		} finally {
			pending.current = false;
		}
	}
	return (
		<div className={cx("copy-action")}>
			<Button
				type="button"
				aria-disabled={state === "copying"}
				onClick={() => void copyAnswer()}
			>
				{t.copyAnswer}
			</Button>
			<span role="status" className={cx("copy-status")}>
				{state === "copied"
					? t.copied
					: state === "failed"
						? t.copyFailed
						: state === "copying"
							? t.copying
							: ""}
			</span>
		</div>
	);
}
