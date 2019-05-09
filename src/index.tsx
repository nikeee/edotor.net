import * as React from "react";
import { render } from "react-dom";

import "./bootstrap.ts";

import "./index.scss";

import { BarLoader } from "react-spinners";
import { SiteLogo } from "./components/SiteLogo";
import { Footer } from "./components/Footer";
import { ItemSelection } from "./components/ItemSelection";
import { ItemMenu } from "./components/ItemMenu";

import { SupportedEngine, SupportedFormat, exportAs, saveSource } from "./rendering";
import { samples, tutorial } from "./samples";
import { supportedEngines, displayFormats, ExportableFormat, sourceFormatExtension } from "./viz";
import { TooltipButton } from "./components/TooltipButton";
import { FileSaver } from "./FileSaver";
import { copyToClipboard, getSourceFromUrl, getShareUrl } from "./utils";
import { getLastSource } from "./config";

const LazySplitEditor = React.lazy(() => import("./components/SplitEditor"));

const defaultEngine = supportedEngines[1];

interface State {
	engine: SupportedEngine;
}
interface Props {
	initialText?: string;
}

const defaultSource = tutorial;
const loadingStyle = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as const;

class App extends React.Component<Props, State> {

	private currentSource: string | undefined = undefined;
	private saver: FileSaver = new FileSaver();
	private editorRef: React.RefObject<import("./components/SplitEditor").default> = React.createRef();

	state: State = {
		engine: defaultEngine,
	};

	private onChangeEngine = (engine: SupportedEngine): void => {
		this.setState({
			engine,
		});
	}

	private loadSample = (sampleDotSrc: string): void => {
		if (!sampleDotSrc)
			return;

		const editor = this.editorRef.current;
		if (sampleDotSrc && editor) {
			editor.loadDotSource(sampleDotSrc);
		}
	}

	private exportAs = (format: ExportableFormat): void => {
		const dotSrc = this.currentSource;
		if (dotSrc) {
			if (format === sourceFormatExtension) {
				saveSource(dotSrc, this.saver)
			} else {
				exportAs(dotSrc, format, this.state, this.saver);
			}
		}
	}

	private sourceChanged = (source: string): void => {
		this.currentSource = source;
	}

	private share = (): boolean => {
		const sourceToShare = this.currentSource;
		if (!sourceToShare)
			return false;

		const link = getShareUrl(sourceToShare);
		copyToClipboard(link);
		return true;
	}

	public render() {
		const s = this.state;
		const p = this.props;
		const initialSource = p.initialText ? p.initialText : defaultSource;

		return (
			<div className="main-container">
				<nav className="navbar navbar-expand-md navbar-dark bg-dark mb-0">
					<a className="navbar-brand" href="//edotor.net"><SiteLogo /></a>

					<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar-collapse">
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
								defaultItem={defaultEngine}
								possibleItems={supportedEngines}
								label="Engine:"
								selectionClassName="engine"
							/>
						</ul>
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
				<React.Suspense fallback={
					<div style={loadingStyle}>
						<BarLoader />
					</div>
				}>
					<LazySplitEditor
						ref={this.editorRef}
						initialSource={initialSource}
						format="svg"
						engine={s.engine}
						onSourceChange={this.sourceChanged}
					/>
				</React.Suspense>
				<Footer />
			</div>
		);
	}
}

const urlSource = getSourceFromUrl() || getLastSource();

render(
	<App initialText={urlSource} />,
	document.getElementById("root"),
);
