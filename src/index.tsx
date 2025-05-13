import { lazy, Component, type RefObject, createRef, Suspense } from "react";
import { createRoot } from "react-dom/client";

import "./bootstrap";

import "./index.scss";

import BarLoader from "react-spinners/BarLoader";

import { SiteLogo } from "./components/SiteLogo";
import { ItemSelection } from "./components/ItemSelection";
import { ItemMenu } from "./components/ItemMenu";

import { type SupportedEngine, exportAs, saveSource } from "./rendering";
import { samples, tutorial } from "./samples";
import {
	supportedEngines,
	displayFormats,
	type ExportableFormat,
	sourceFormatExtension,
} from "./viz";
import { TooltipButton } from "./components/TooltipButton";
import { FileSaver } from "./FileSaver";
import { copyToClipboard, getSourceFromUrl, getShareUrl } from "./utils";
import { mergeStates, getLastState, saveLastEngine } from "./config";
import Version from "./components/Version";

import $ from "jquery";

window.jQuery = window.$ = $;

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
	private currentSource: string | undefined = undefined;
	private saver: FileSaver = new FileSaver();
	private editorRef: RefObject<
		import("./components/SplitEditor").default | null
	> = createRef();

	state: State;

	constructor(p: Props) {
		super(p);
		this.state = {
			engine: p.initialEngine ?? defaultEngine,
		};
	}

	private onChangeEngine = (engine: SupportedEngine): void => {
		this.setState(
			{
				engine,
			},
			() => saveLastEngine(this.state.engine),
		);
	};

	private loadSample = (sampleDotSrc: string): void => {
		if (!sampleDotSrc) return;

		const editor = this.editorRef.current;
		if (sampleDotSrc && editor) {
			editor.loadDotSource(sampleDotSrc);
		}
	};

	private exportAs = (format: ExportableFormat): void => {
		const dotSrc = this.currentSource;
		if (dotSrc) {
			if (format === sourceFormatExtension) {
				saveSource(dotSrc, this.saver);
			} else {
				exportAs(dotSrc, format, this.state, this.saver);
			}
		}
	};

	private sourceChanged = (source: string): void => {
		this.currentSource = source;
	};

	private share = (): boolean => {
		const sourceToShare = this.currentSource;
		if (!sourceToShare) return false;

		const link = getShareUrl({
			source: sourceToShare,
			engine: this.state.engine,
		});

		copyToClipboard(link);
		return true;
	};

	public render() {
		const s = this.state;
		const p = this.props;
		const initialSource = p.initialText ? p.initialText : defaultSource;

		return (
			<div className="main-container">
				<nav className="navbar navbar-expand-md navbar-dark bg-dark mb-0">
					<a className="navbar-brand" href="//edotor.net">
						<SiteLogo />
					</a>

					<button
						className="navbar-toggler"
						type="button"
						data-toggle="collapse"
						data-target="#navbar-collapse"
					>
						<span className="navbar-toggler-icon" />
					</button>

					<div className="collapse navbar-collapse" id="navbar-collapse">
						<ul className="navbar-nav mr-auto">
							<ItemMenu
								onClickItem={this.loadSample}
								items={samples}
								label="Load Sample"
							/>

							<ItemMenu
								onClickItem={this.exportAs}
								items={displayFormats}
								label="Download"
							/>

							<ItemSelection
								onChangeItem={this.onChangeEngine}
								defaultItem={s.engine}
								possibleItems={supportedEngines}
								label="Engine:"
								selectionClassName="engine"
							/>
						</ul>
					</div>

					<div className="nav-item navbar-nav">
						<a
							className="nav-link external-link"
							target="_blank"
							rel="noopener noreferrer"
							href="//www.graphviz.org/documentation/"
						>
							Graphviz Documentation
						</a>
					</div>

					<div className="nav-item navbar-nav">
						<a
							className="nav-link external-link"
							target="_blank"
							rel="noopener noreferrer"
							href="//github.com/nikeee/edotor.net"
						>
							Issues
						</a>
						{import.meta.env.DEV && <Version />}
					</div>

					<div className="btn-group btn-group-sm">
						<TooltipButton
							onClick={this.share}
							title="Link copied to clipboard!"
							className="btn-secondary"
						>
							Copy Share Link
						</TooltipButton>
					</div>
				</nav>
				<Suspense
					fallback={
						<div style={loadingStyle}>
							<BarLoader />
						</div>
					}
				>
					<LazySplitEditor
						ref={this.editorRef}
						initialSource={initialSource}
						format="svg"
						engine={s.engine}
						onSourceChange={this.sourceChanged}
					/>
				</Suspense>
			</div>
		);
	}
}

const initialState = mergeStates(getSourceFromUrl(), getLastState());

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const root = createRoot(document.getElementById("root")!);
root.render(
	<App initialText={initialState.source} initialEngine={initialState.engine} />,
);
