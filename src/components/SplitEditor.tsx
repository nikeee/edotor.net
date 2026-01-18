import type * as monaco from "monaco-editor";
import { lazy, Suspense, useImperativeHandle, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BarLoader } from "react-spinners";
import SplitPane from "react-split-pane";

import { getSplitConfig, saveSplitConfig } from "../config.js";
import type { SupportedEngine, SupportedFormat } from "../rendering.js";

const EditorLazy = lazy(() => import("./Editor.js"));
const GraphPaneLazy = lazy(() => import("./GraphPane.js"));

export type SplitEditorHandle = {
	loadSource: (source: string) => void;
	getSource: () => string;
};

export type SplitEditorProps = {
	initialSource: string;
	format: SupportedFormat;
	engine: SupportedEngine;
	onSourceChange: () => void;
	ref?: React.Ref<SplitEditorHandle>;
};

type SplitEditorState = SourceState | ErroredState;
type SourceState = {
	dotSrc: string;
	errorCount?: undefined;
	lastKnownGoodSrc?: undefined;
};
type ErroredState = {
	dotSrc?: undefined;
	errorCount: number;
	lastKnownGoodSrc?: string;
};

const loadingStyle = {
	position: "absolute",
	display: "flex",
	inset: "0",
	justifyContent: "center",
	alignItems: "center",
} as const;

export default function SplitEditor({
	initialSource,
	format,
	engine,
	onSourceChange,
	ref,
}: SplitEditorProps) {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const [initialValue] = useState(initialSource);

	const [state, setState] = useState<SplitEditorState>({
		dotSrc: initialSource,
	});

	useImperativeHandle(ref, () => ({
		loadSource: (source: string) => {
			editorRef.current?.setValue(source);
			setState({ dotSrc: source });
		},
		getSource: () => editorRef.current?.getValue() ?? "",
	}));

	const sourceToRender = state.dotSrc || state.lastKnownGoodSrc || "";
	console.log({ sourceToRender, state });

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
						ref={editorRef}
						initialValue={initialValue}
						onChangeValue={(value, errors) => {
							if (errors === 0) {
								setState({ dotSrc: value });
								return;
							}
							setState(prev => ({
								errorCount: errors,
								lastKnownGoodSrc: prev.dotSrc ?? prev.lastKnownGoodSrc,
							}));

							onSourceChange?.();
						}}
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
						hasErrors={!!(state.errorCount && state.errorCount > 0)}
						dotSrc={sourceToRender}
						engine={engine}
						format={format}
					/>
				</Suspense>
			</ErrorBoundary>
		</SplitPane>
	);
}
