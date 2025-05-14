import { Component, type PropsWithChildren, createRef } from "react";

interface Props extends PropsWithChildren {
	onClick: () => boolean;
	title?: string;

	className?: string;
}

export class TooltipButton extends Component<Props, object> {
	#buttonRef: React.RefObject<HTMLButtonElement | null> = createRef();

	#timeout: ReturnType<typeof setTimeout> | undefined;

	#handleClick = () => {
		const handler = this.props.onClick;
		if (!handler) {
			return;
		}

		const showTooltip = handler();
		if (!showTooltip) {
			return;
		}

		const domButton = this.#buttonRef.current;
		if (!domButton) {
			return;
		}

		($(domButton) as unknown as { tooltip(s: string): void }).tooltip("show");
		this.#removeTimeout();

		setTimeout(
			() =>
				($(domButton) as unknown as { tooltip(s: string): void }).tooltip(
					"hide",
				),
			2500,
		);
	};

	#removeTimeout() {
		const timeout = this.#timeout;
		if (timeout) {
			clearTimeout(timeout);
			this.#timeout = undefined;
		}
	}

	componentWillUnmount() {
		this.#removeTimeout();
	}

	componentDidMount() {
		this.#updateTooltipTriggers();
	}

	componentDidUpdate() {
		this.#updateTooltipTriggers();
	}

	#updateTooltipTriggers() {
		const domButton = this.#buttonRef.current;
		if (domButton) {
			(
				$(domButton) as unknown as { tooltip(t: { trigger: string }): void }
			).tooltip({
				trigger: "click",
			});
		}
	}

	render() {
		const p = this.props;
		return (
			<button
				ref={this.#buttonRef}
				className={p.className ? `btn ${p.className}` : "btn"}
				type="button"
				data-toggle="tooltip"
				title={p.title}
				onClick={this.#handleClick}
			>
				{p.children}
			</button>
		);
	}
}
