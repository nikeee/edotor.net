import { Component, createRef, type RefObject } from "react";
import svgPanZoom from "svg-pan-zoom";
import { type Rendering, type SupportedFormat, type SupportedEngine, renderElement } from "../rendering";
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

function isRenderingState(s: State): s is RenderingState {
	if (s.error !== undefined)
		return false;
	const e = s.element;
	if (e === undefined)
		return false;
	// Dirty hack to catch erroneous XML/SVGs by Viz.js (Chrome and Firefox output behave differently)
	return !e.innerHTML.includes("<parsererror") // Chrome
		&& !e.innerHTML.includes("<sourcetext"); // Firefox
}

const isErrorState = (s: State): s is ErrorState => s.element === undefined && s.error !== undefined;

export interface Props {
	dotSrc: string;
	format: SupportedFormat;
	engine: SupportedEngine;
}

export class Graph extends Component<Props, State> {
	private containerRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
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
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (e: any) {
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
		minZoom: 0.001,
		maxZoom: 200,
		zoomScaleSensitivity: 0.5,
	});
};
