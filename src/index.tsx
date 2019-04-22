import * as React from "react";
import * as ReactDOM from "react-dom";

// TODO: Only import what is needed
import "bootstrap";

import "./index.scss";

import { SplitEditor } from "./components/SplitEditor";
import { SiteLogo } from "./components/SiteLogo";
import { Footer } from "./components/Footer";
import { ItemSelection } from "./components/ItemSelection";
import { ItemMenu } from "./components/ItemMenu";

import { SupportedEngine, SupportedFormat, exportAs } from "./rendering";
import { samples, tutorial } from "./samples";
import { supportedEngines, supportedFormats, displayFormats } from "./viz";
import { TooltipButton } from "./components/TooltipButton";
import { FileSaver } from "./FileSaver";
import { copyToClipboard, getSourceFromUrl, getShareUrl } from "./utils";

const defaultEngine = supportedEngines[1];

interface State {
	engine: SupportedEngine;
}
interface Props {
	initialText?: string;
}

const defaultSource = tutorial;

class App extends React.Component<Props, State> {

	private currentSource: string | undefined = undefined;
	private saver: FileSaver;
	private editorRef: React.RefObject<SplitEditor>;

	constructor(props: Props) {
		super(props);

		this.state = {
			engine: defaultEngine,
		};
		this.saver = new FileSaver();
		this.editorRef = React.createRef();
	}

	private onChangeEngine = (engine: SupportedEngine): void => {
		this.setState({
			engine,
		});
	}

	private loadSample = (sampleName: keyof typeof samples): void => {
		if (!sampleName)
			return;

		const sampleDotSrc = samples[sampleName];
		const editor = this.editorRef.current;
		if (sampleDotSrc && editor) {
			editor.loadDotSource(sampleDotSrc);
		}
	}

	private exportAs = (format: "SVG" | "PNG"): void => {
		const dotSrc = this.currentSource;
		if (format && dotSrc) {
			exportAs(dotSrc, format.toLowerCase() as SupportedFormat, this.state, this.saver);
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
								items={Object.keys(samples)}
								id="loadSampleMenu"
								label="Load Sample"
							/>

							<ItemMenu
								onClickItem={this.exportAs}
								items={supportedFormats.map(i => displayFormats[i])}
								id="downloadMenu"
								label="Download"
							/>

							<ItemSelection
								onChangeItem={this.onChangeEngine}
								defaultItem={defaultEngine}
								possibleItems={supportedEngines}
								label="Engine:"
								selectionClassName="engine"
								id="engineSelect"
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

				<SplitEditor
					ref={this.editorRef}
					initialSource={initialSource}
					format="svg"
					engine={s.engine}
					onSourceChange={this.sourceChanged}
				/>

				<Footer />
			</div>
		);
	}
}

const urlSource = getSourceFromUrl();

const rootComponent = <App initialText={urlSource} />;
const rootElement = document.getElementById("root");

ReactDOM.render(rootComponent, rootElement);

const spinner = document.getElementsByClassName("spinner")[0];
if (spinner && spinner.parentNode) {
	spinner.parentNode.removeChild(spinner);
}
