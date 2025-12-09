import type * as monaco from "monaco-editor";
import { Component, createRef, lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BarLoader } from "react-spinners";
import SplitPane from "react-split-pane";

import { getSplitConfig, saveSplitConfig } from "../config.js";
import type { SupportedEngine, SupportedFormat } from "../rendering.js";

const EditorLazy = lazy(() => import("./Editor.js"));
const GraphPaneLazy = lazy(() => import("./GraphPane.js"));

type ErrorList = monaco.editor.IMarkerData[];

export type SplitEditorProps = {
	initialSource: string;
	format: SupportedFormat;
	engine: SupportedEngine;
	onSourceChange?(source: string): void;
};

type SplitEditorState = SourceState | ErroredState;
type SourceState = {
	dotSrc: string;
	errors?: undefined;
	lastKnownGoodSrc?: undefined;
};
type ErroredState = {
	dotSrc?: undefined;
	errors: ErrorList;
	lastKnownGoodSrc?: string;
};

const loadingStyle = {
	position: "absolute",
	display: "flex",
	inset: "0",
	justifyContent: "center",
	alignItems: "center",
} as const;

export default class SplitEditor extends Component<
	SplitEditorProps,
	SplitEditorState
> {
	#editorRef = createRef<monaco.editor.IStandaloneCodeEditor>();

	constructor(props: SplitEditorProps) {
		super(props);
		const p = this.props;

		this.state = { dotSrc: p.initialSource };
		p.onSourceChange?.(this.state.dotSrc);
	}

	loadDotSource(dotSrc: string) {
		// Change the value of the underlying monaco instance
		// Monaco will call onChange and
		// the rest is going to be handled as if the user changed the value by hand
		this.#editorRef.current?.setValue(dotSrc);
	}

	dotSourceChanged = (dotSrc: string): void => {
		this.props.onSourceChange?.(dotSrc);
		this.setState({ dotSrc });
	};

	dotSourceErrored = (errors: ErrorList): void => {
		this.setState(prev => ({
			errors,
			lastKnownGoodSrc: prev.dotSrc || prev.lastKnownGoodSrc,
		}));
	};

	render() {
		const s = this.state;
		const p = this.props;

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
					<Suspense
						fallback={
							<div style={loadingStyle}>
								<BarLoader />
							</div>
						}
					>
						<EditorLazy
							ref={this.#editorRef}
							initialValue={s.dotSrc}
							onChangeValue={() => []}
							onValueError={n => void n}
						/>
					</Suspense>
				</ErrorBoundary>
				<ErrorBoundary fallback="Could not load graph preview">
					<Suspense
						fallback={
							<div style={loadingStyle}>
								<BarLoader />
							</div>
						}
					>
						<GraphPaneLazy
							hasErrors={!!(s.errors && s.errors.length > 0)}
							dotSrc={s.dotSrc || s.lastKnownGoodSrc || ""}
							engine={p.engine}
							format={p.format}
						/>
					</Suspense>
				</ErrorBoundary>
			</SplitPane>
		);
	}
}
