import { Component, createRef, lazy, type RefObject, Suspense } from "react";
import { createRoot } from "react-dom/client";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import "./index.scss";

import BarLoader from "react-spinners/BarLoader";
import Navigation from "./components/Navigation";
import { getLastState, mergeStates, saveLastEngine } from "./config";
import { FileSaver } from "./FileSaver";
import { exportAs, type SupportedEngine, saveSource } from "./rendering";
import { tutorial } from "./samples";
import { copyToClipboard, getShareUrl, getSourceFromUrl } from "./utils";
import {
	type ExportableFormat,
	sourceFormatExtension,
	supportedEngines,
} from "./viz";

const LazySplitEditor = lazy(() => import("./components/SplitEditor"));

const defaultEngine = supportedEngines[1];

interface State {
	engine: SupportedEngine;
}
interface Props {
	initialText?: string;
	initialEngine?: SupportedEngine;
}

const defaultSource = tutorial;
const loadingStyle = {
	position: "fixed",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
} as const;

class App extends Component<Props, State> {
	#currentSource: string | undefined = undefined;
	#saver: FileSaver = new FileSaver();
	#editorRef: RefObject<import("./components/SplitEditor").default | null> =
		createRef();

	state: State;

	constructor(p: Props) {
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
				<Suspense
					fallback={
						<div style={loadingStyle}>
							<BarLoader />
						</div>
					}
				>
					<LazySplitEditor
						ref={this.#editorRef}
						initialSource={initialSource}
						format="svg"
						engine={s.engine}
						onSourceChange={this.#sourceChanged}
					/>
				</Suspense>
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
