import { useId } from "react";
import type { SupportedEngine, SupportedFormat } from "../rendering";
import { samples } from "../samples";

import { displayFormats, supportedEngines } from "../viz/index.js";
import ItemMenu from "./ItemMenu.js";
import ItemSelection from "./ItemSelection.js";
import SiteLogo from "./SiteLogo.js";
import TooltipButton from "./TooltipButton.js";
import Version from "./Version.js";

export type NavigationProps = {
	loadSample: (sampleName: string) => void;
	exportAs: (format: SupportedFormat) => void;

	currentEngine: SupportedEngine;
	changeEngine: (engine: SupportedEngine) => void;

	share: () => boolean;
};

export default function Navigation({
	loadSample,
	exportAs,
	currentEngine,
	changeEngine,
	share,
}: NavigationProps) {
	const navbarId = useId();
	return (
		<nav className="navbar navbar-expand-md navbar-dark bg-dark mb-0">
			<div className="container-fluid">
				<a className="navbar-brand" href="//edotor.net">
					<SiteLogo />
				</a>

				<button
					className="navbar-toggler"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target={`#${navbarId}`}
				>
					<span className="navbar-toggler-icon" />
				</button>

				<div className="collapse navbar-collapse" id={navbarId}>
					<ul className="navbar-nav me-auto">
						<ItemMenu
							onClickItem={loadSample}
							items={samples}
							label="Load Sample"
						/>

						<ItemMenu
							onClickItem={exportAs}
							items={displayFormats}
							label="Download"
						/>

						<ItemSelection
							onChangeItem={changeEngine}
							defaultItem={currentEngine}
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
						onClick={share}
						title="Link copied to clipboard!"
						className="btn-secondary"
					>
						Copy Share Link
					</TooltipButton>
				</div>
			</div>
		</nav>
	);
}
