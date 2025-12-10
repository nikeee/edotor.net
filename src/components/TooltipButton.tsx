import { Tooltip } from "bootstrap";
import { useCallback, useEffect, useRef } from "react";

export type TooltipButtonProps = {
	onClick: () => boolean;
	title?: string;
	className?: string;
	children?: React.ReactNode;
};

export default function TooltipButton({
	onClick,
	title,
	className,
	children,
}: TooltipButtonProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const tooltipRef = useRef<Tooltip | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	useEffect(() => {
		const button = buttonRef.current;
		if (!button) {
			return;
		}

		tooltipRef.current = new Tooltip(button, {
			trigger: "manual",
			title,
		});

		return () => {
			tooltipRef.current?.dispose();
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [title]);

	const handleClick = useCallback(() => {
		const shouldShow = onClick?.();
		if (!shouldShow) {
			return;
		}

		const tooltip = tooltipRef.current;
		if (!tooltip) {
			return;
		}

		tooltip.show();

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			tooltip.hide();
		}, 2500);
	}, [onClick]);

	return (
		<button
			ref={buttonRef}
			className={`btn ${className ?? ""}`}
			type="button"
			onClick={handleClick}
		>
			{children}
		</button>
	);
}
