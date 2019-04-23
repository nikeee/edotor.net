import * as React from "react";
import * as svgPanZoom from "svg-pan-zoom";
import { Rendering, SupportedFormat, SupportedEngine, renderElement } from "../rendering";
import { removeChildren } from "../utils";

import "./Graph.css";

// Thanks to mdaines for providing a react sample
type State = ErrorState | RenderingState | EmptyState;

interface ErrorState {
	element: undefined;
	error: string;
}
interface RenderingState {
	element: Rendering;
	error: undefined;
}
interface EmptyState {
	element: undefined;
	error: undefined;
}

const createEmptyState = (): EmptyState => ({ element: undefined, error: undefined });
const createElementState = (element: Rendering): RenderingState => ({ element, error: undefined });
const createErrorState = (error: string): ErrorState => ({ element: undefined, error });

const isEmptyState = (s: State): s is EmptyState => s.element === undefined && s.error === undefined;
const isRenderingState = (s: State): s is RenderingState => s.element !== undefined && s.error === undefined;
const isErrorState = (s: State): s is ErrorState => s.element === undefined && s.error !== undefined;

export interface Props {
	dotSrc: string;
	format: SupportedFormat;
	engine: SupportedEngine;
}

export class Graph extends React.Component<Props, State> {
	private containerRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
	private panZoomContainer: SvgPanZoom.Instance | undefined;

	state: State = createEmptyState();

	private async updateGraph(): Promise<void> {
		const { dotSrc, format, engine } = this.props;

		// If the input is empty (or only whitespace), render nothing.
		if (!dotSrc.match(/\S+/)) {
			this.setState(createEmptyState());
			return;
		}

		let element: Rendering;
		try {
			element = await renderElement(dotSrc, format, engine);
		} catch (e) {
			this.setState(createErrorState(e.message));
			return;
		}
		if (element) {
			this.setState(createElementState(element));
		} else {
			this.setState(createErrorState("Graph could not be rendered"));
		}
	}

	public componentDidMount() {
		this.updateGraph();
	}
	public componentWillUnmount() {
		this.destroyCurrentZoomContainer();
	}
	private destroyCurrentZoomContainer() {
		const container = this.panZoomContainer;
		if (container)
			container.destroy();
	}

	public componentDidUpdate(prevProps: Props, prevState: State) {
		const { dotSrc, format, engine } = this.props;

		if (dotSrc !== prevProps.dotSrc
			|| format !== prevProps.format
			|| engine !== prevProps.engine
		) {
			this.updateGraph();
		}

		const state = this.state;
		if (state.element !== prevState.element && this.containerRef.current) {
			const container = this.containerRef.current;
			removeChildren(container);

			if (isRenderingState(state)) {
				// It is important to add the element before creating the zoom container
				container.appendChild(state.element);

				const zoomContainer = createZoomWrapper(state.element);
				zoomContainer.zoom(0.8);

				this.destroyCurrentZoomContainer();
				this.panZoomContainer = zoomContainer;
			}
		}
	}

	public render() {
		return (
			<div className={"graph"} ref={this.containerRef} />
		);
	}
}

const createZoomWrapper = (child: Rendering): SvgPanZoom.Instance => {
	return svgPanZoom(child, {
		zoomEnabled: true,
		controlIconsEnabled: false,
		fit: true,
		center: true,
		minZoom: 0.1,
		zoomScaleSensitivity: 0.5,
	});
};
