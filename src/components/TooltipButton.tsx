import * as React from "react";

interface Props {
	onClick(): boolean;
	title?: string;

	className?: string;
	children: any
}

export class TooltipButton extends React.Component<Props, object> {
	private buttonRef: React.RefObject<HTMLButtonElement> = React.createRef();

	private timeout: ReturnType<typeof setTimeout> | undefined;

	private handleClick = () => {
		const handler = this.props.onClick;
		if (handler) {
			const showTooltip = handler();

			if (showTooltip) {
				const domButton = this.buttonRef.current;

				if (domButton) {
					($(domButton) as any).tooltip("show");
					this.removeTimeout();
					setTimeout(() => ($(domButton) as any).tooltip("hide"), 2500);
				}
			}
		}
	}

	private removeTimeout() {
		const timeout = this.timeout;
		if (timeout) {
			clearTimeout(timeout);
			this.timeout = undefined;
		}
	}

	public componentWillUnmount() {
		this.removeTimeout();
	}

	public componentDidMount() {
		this.updateTooltipTriggers();
	}

	public componentDidUpdate() {
		this.updateTooltipTriggers();
	}

	private updateTooltipTriggers() {
		const domButton = this.buttonRef.current;
		if (domButton) {
			($(domButton) as any).tooltip({ trigger: "click" });
		}
	}

	public render() {
		const p = this.props;
		return (
			<button
				ref={this.buttonRef}
				className={p.className ? `btn ${p.className}` : "btn"}
				type="button"
				data-toggle="tooltip"
				title={p.title}
				onClick={this.handleClick}
			>
				{p.children}
			</button>
		);
	}
}
