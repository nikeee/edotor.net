import type * as monaco from "monaco-editor";
import { Component, createRef, type RefObject } from "react";
import { ErrorBoundary } from "react-error-boundary";
import SplitPane from "react-split-pane";

import { getSplitConfig, saveSplitConfig } from "../config.js";
import type { SupportedEngine, SupportedFormat } from "../rendering.js";
import EditorPane from "./EditorPane.js";
import GraphPane from "./GraphPane.js";

type ErrorList = monaco.editor.IMarkerData[];

interface Props {
	initialSource: string;
	format: SupportedFormat;
	engine: SupportedEngine;
	onSourceChange?(source: string): void;
}

type State = SourceState | ErroredState;
interface SourceState {
	dotSrc: string;
	errors: undefined;
	lastKnownGoodSrc: undefined;
}
interface ErroredState {
	dotSrc: undefined;
	errors: ErrorList;
	lastKnownGoodSrc?: string;
}

const createSourceState = (dotSrc: string): SourceState => ({
	dotSrc,
	errors: undefined,
	lastKnownGoodSrc: undefined,
});
const createErroredState = (
	errors: ErrorList,
	lastKnownGoodSrc?: string,
): ErroredState => ({ dotSrc: undefined, errors, lastKnownGoodSrc });

export default class SplitEditor extends Component<Props, State> {
	#editorPaneRef: RefObject<EditorPane | null> = createRef<EditorPane>();

	constructor(props: Props) {
		super(props);
		const p = this.props;

		this.state = createSourceState(p.initialSource);
		if (p.onSourceChange) p.onSourceChange(this.state.dotSrc);
	}

	loadDotSource(dotSrc: string) {
		// Change the value of the underlying monaco instance
		// Monaco will call onChange and
		// the rest is going to be handled as if the user changed the value by hand
		const editor = this.#editorPaneRef.current;
		if (editor) {
			editor.loadValue(dotSrc);
		}
	}

	dotSourceChanged = (dotSrc: string): void => {
		const p = this.props;
		if (p.onSourceChange) p.onSourceChange(dotSrc);

		this.setState(createSourceState(dotSrc));
	};

	dotSourceErrored = (errors: ErrorList): void => {
		this.setState(prevState => {
			const lastKnownGoodSrc = prevState.dotSrc || prevState.lastKnownGoodSrc;
			return createErroredState(errors, lastKnownGoodSrc);
		});
	};

	#getDotSrcToRender() {
		const s = this.state;
		return s.dotSrc || s.lastKnownGoodSrc || "";
	}

	render() {
		const s = this.state;
		const p = this.props;

		const dotSrc = this.#getDotSrcToRender();

		return (
			<SplitPane
				split="vertical"
				minSize={50}
				defaultSize={getSplitConfig() || "50%"}
				onChange={size => saveSplitConfig(size)}
				// biome-ignore lint/suspicious/noExplicitAny: hack for: https://github.com/tomkp/react-split-pane/issues/830#issuecomment-2788356773
				{...({} as any)}
			>
				<ErrorBoundary fallback="Could not load editor">
					<EditorPane
						ref={this.#editorPaneRef}
						defaultValue={s.dotSrc}
						onChangeValue={this.dotSourceChanged}
						onValueError={this.dotSourceErrored}
					/>
				</ErrorBoundary>
				<ErrorBoundary fallback="Could not load graph preview">
					<GraphPane
						hasErrors={!!(s.errors && s.errors.length > 0)}
						dotSrc={dotSrc}
						engine={p.engine}
						format={p.format}
					/>
				</ErrorBoundary>
			</SplitPane>
		);
	}
}
