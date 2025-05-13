import * as React from "react";
import SplitPane from "react-split-pane";
import type * as monaco from 'monaco-editor';

import { EditorPane } from "./EditorPane";
import { GraphPane } from "./GraphPane";
import type { SupportedFormat, SupportedEngine } from "../rendering";
import { getSplitConfig, saveSplitConfig } from "../config";

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

const createSourceState = (dotSrc: string): SourceState => ({ dotSrc, errors: undefined, lastKnownGoodSrc: undefined });
const createErroredState = (errors: ErrorList, lastKnownGoodSrc?: string): ErroredState => ({ dotSrc: undefined, errors, lastKnownGoodSrc });

export default class SplitEditor extends React.Component<Props, State> {

	private editorPaneRef: React.RefObject<EditorPane> = React.createRef();

	constructor(props: Props) {
		super(props);
		const p = this.props;

		this.state = createSourceState(p.initialSource);
		if (p.onSourceChange)
			p.onSourceChange(this.state.dotSrc);
	}

	public loadDotSource(dotSrc: string) {
		// Change the value of the underlying monaco instance
		// Monaco will call onChange and
		// the rest is going to be handled as if the user changed the value by hand
		const editor = this.editorPaneRef.current;
		if (editor) {
			editor.loadValue(dotSrc);
		}
	}

	dotSourceChanged = (dotSrc: string): void => {
		const p = this.props;
		if (p.onSourceChange)
			p.onSourceChange(dotSrc);

		this.setState(createSourceState(dotSrc));
	}

	dotSourceErrored = (errors: ErrorList): void => {
		this.setState(prevState => {
			const lastKnownGoodSrc = prevState.dotSrc || prevState.lastKnownGoodSrc;
			return createErroredState(errors, lastKnownGoodSrc);
		});
	}

	private getDotSrcToRender() {
		const s = this.state;

		return s.dotSrc
			? s.dotSrc
			: (s.lastKnownGoodSrc ? s.lastKnownGoodSrc : "");
	}

	public render() {
		const s = this.state;
		const p = this.props;

		const isErrored = s.errors && s.errors.length > 0;
		const dotSrc = this.getDotSrcToRender();

		const graphPaneClass = isErrored ? "errored" : "successful";

		return (
			<SplitPane
				split="vertical"
				minSize={50}
				defaultSize={getSplitConfig() || "50%"}
				onChange={size => saveSplitConfig(size)}
			>
				<EditorPane
					ref={this.editorPaneRef}
					defaultValue={s.dotSrc}
					onChangeValue={this.dotSourceChanged}
					onValueError={this.dotSourceErrored}
				/>

				<GraphPane className={`graph-container ${graphPaneClass}`}
					dotSrc={dotSrc}
					engine={p.engine}
					format={p.format}
				/>
			</SplitPane>
		);
	}
}
