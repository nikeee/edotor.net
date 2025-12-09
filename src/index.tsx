import { Component, createRef, type RefObject } from "react";
import { createRoot } from "react-dom/client";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import "./index.scss";

import Navigation from "./components/Navigation.js";
import SplitEditor from "./components/SplitEditor.js";
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
} from "./viz/index.js";

const defaultEngine = supportedEngines[1];

interface AppState {
	engine: SupportedEngine;
}
interface AppProps {
	initialText?: string;
	initialEngine?: SupportedEngine;
}

const defaultSource = tutorial;

const SOURCE_SAVE_TIMEOUT = 5 * 1000; // 5 seconds

class App extends Component<AppProps, AppState> {
	#currentSource: string | undefined = undefined;
	#saver: FileSaver = new FileSaver();
	#editorRef: RefObject<import("./components/SplitEditor").default | null> =
		createRef();

	#autoSaveTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	state: AppState;

	constructor(p: AppProps) {
		super(p);
		this.state = {
			engine: p.initialEngine ?? defaultEngine,
		};
	}

	#onChangeEngine = (engine: SupportedEngine): void => {
		this.setState(
			{
				engine,
			},
			() => saveLastEngine(this.state.engine),
		);
	};

	#loadSample = (sampleDotSrc: string): void => {
		if (!sampleDotSrc) return;

		const editor = this.#editorRef.current;
		if (sampleDotSrc && editor) {
			editor.loadDotSource(sampleDotSrc);
		}
	};

	#exportAs = (format: ExportableFormat): void => {
		const dotSrc = this.#currentSource;
		if (dotSrc) {
			if (format === sourceFormatExtension) {
				saveSource(dotSrc, this.#saver);
			} else {
				exportAs(dotSrc, format, this.state, this.#saver);
			}
		}
	};

	#sourceChanged = (source: string): void => {
		this.#currentSource = source;

		if (typeof this.#autoSaveTimeout !== "undefined") {
			clearTimeout(this.#autoSaveTimeout);
		}

		this.#autoSaveTimeout = setTimeout(
			() => saveLastSource(source),
			SOURCE_SAVE_TIMEOUT,
		);
	};

	#share = (): boolean => {
		const sourceToShare = this.#currentSource;
		if (!sourceToShare) return false;

		const link = getShareUrl({
			source: sourceToShare,
			engine: this.state.engine,
		});

		copyToClipboard(link);
		return true;
	};

	render() {
		const s = this.state;
		const p = this.props;
		const initialSource = p.initialText ? p.initialText : defaultSource;
		return (
			<div className="main-container">
				<Navigation
					changeEngine={this.#onChangeEngine}
					currentEngine={s.engine}
					exportAs={this.#exportAs}
					loadSample={this.#loadSample}
					share={this.#share}
				/>
				<SplitEditor
					ref={this.#editorRef}
					initialSource={initialSource}
					format="svg"
					engine={s.engine}
					onSourceChange={this.#sourceChanged}
				/>
			</div>
		);
	}
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
