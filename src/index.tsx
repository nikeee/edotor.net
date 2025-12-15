import { type RefObject, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import "./index.scss";

import Navigation from "./components/Navigation.js";
import SplitEditor, {
	type SplitEditorHandle,
} from "./components/SplitEditor.js";
import {
	getLastState,
	mergeStates,
	saveLastEngine,
	saveLastSource,
} from "./config.js";
import { FileSaver } from "./FileSaver.js";
import { exportAs, type SupportedEngine, saveSource } from "./rendering.js";
import { tutorial } from "./samples/index.js";
import { copyToClipboard, getShareUrl, getSourceFromUrl } from "./utils.js";
import {
	type ExportableFormat,
	sourceFormatExtension,
	supportedEngines,
} from "./viz.js";

const defaultEngine = supportedEngines[1];

interface AppProps {
	initialText?: string;
	initialEngine?: SupportedEngine;
}

const defaultSource = tutorial;

const SOURCE_SAVE_TIMEOUT = 5 * 1000; // 5 seconds
type Timeout = ReturnType<typeof setTimeout>;

const saver = new FileSaver();

function App({ initialText, initialEngine }: AppProps) {
	const [engine, setEngine] = useState<SupportedEngine>(
		initialEngine ?? defaultEngine,
	);

	const currentSourceRef = useRef<string | undefined>(undefined);
	const editorRef: RefObject<SplitEditorHandle | null> = useRef(null);
	const autoSaveTimeoutRef = useRef<Timeout | undefined>(undefined);
	const initialSource = initialText ? initialText : defaultSource;

	useEffect(() => {
		return () => {
			if (typeof autoSaveTimeoutRef.current !== "undefined") {
				clearTimeout(autoSaveTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="main-container">
			<Navigation
				changeEngine={newEngine => {
					setEngine(newEngine);
					saveLastEngine(engine);
				}}
				currentEngine={engine}
				exportAs={(format: ExportableFormat): void => {
					const dotSrc = currentSourceRef.current;
					if (dotSrc) {
						if (format === sourceFormatExtension) {
							saveSource(dotSrc, saver);
						} else {
							exportAs(dotSrc, format, { engine }, saver);
						}
					}
				}}
				loadSample={(sampleDotSrc: string): void => {
					if (!sampleDotSrc) return;

					const editor = editorRef.current;
					if (sampleDotSrc && editor) {
						editor.loadSource(sampleDotSrc);
					}
				}}
				share={() => {
					const sourceToShare = currentSourceRef.current;
					if (!sourceToShare) return false;

					const link = getShareUrl({
						source: sourceToShare,
						engine,
					});

					copyToClipboard(link);
					return true;
				}}
			/>
			<SplitEditor
				ref={editorRef}
				initialSource={initialSource}
				format="svg"
				engine={engine}
				onSourceChange={source => {
					currentSourceRef.current = source;

					if (typeof autoSaveTimeoutRef.current !== "undefined") {
						clearTimeout(autoSaveTimeoutRef.current);
					}

					autoSaveTimeoutRef.current = setTimeout(
						() => saveLastSource(source),
						SOURCE_SAVE_TIMEOUT,
					);
				}}
			/>
		</div>
	);
}

const initialState = mergeStates(
	getSourceFromUrl(new URL(window.location.href)),
	getLastState(),
);

// biome-ignore lint/style/noNonNullAssertion: todo
const root = createRoot(document.getElementById("root")!);
root.render(
	<App initialText={initialState.source} initialEngine={initialState.engine} />,
);
