import type * as monaco from "monaco-editor";
import { Component, createRef, lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BarLoader } from "react-spinners";
import SplitPane from "react-split-pane";

import { getSplitConfig, saveSplitConfig } from "../config.js";
import type { SupportedEngine, SupportedFormat } from "../rendering.js";
import type EditorPane from "./EditorPane.js";

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
	#editorPaneRef = createRef<EditorPane>();

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
		this.#editorPaneRef.current?.loadValue(dotSrc);
	}

	dotSourceChanged = (dotSrc: string): void => {
		this.props.onSourceChange?.(dotSrc);
		this.setState({ dotSrc });
	};

	dotSourceErrored = (errors: ErrorList): void => {
		this.setState(prevState => {
			const lastKnownGoodSrc = prevState.dotSrc || prevState.lastKnownGoodSrc;
			return { errors, lastKnownGoodSrc };
		});
	};

	#getDotSrcToRender() {
		const s = this.state;

		return s.dotSrc ? s.dotSrc : s.lastKnownGoodSrc ? s.lastKnownGoodSrc : "";
	}

	render() {
		const s = this.state;
		const p = this.props;

		const dotSrc = this.#getDotSrcToRender();

		/*
		<EditorPane
			ref={this.#editorPaneRef}
			defaultValue={s.dotSrc}
			onChangeValue={this.dotSourceChanged}
			onValueError={this.dotSourceErrored}
		/>
		*/

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
							dotSrc={dotSrc}
							engine={p.engine}
							format={p.format}
						/>
					</Suspense>
				</ErrorBoundary>
			</SplitPane>
		);
	}
}
