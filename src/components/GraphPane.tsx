import { Graph, type Props as GraphProps } from "./Graph";

import "./GraphPane.css";

export interface GraphPaneProps extends GraphProps {
	className?: string;
}

export default function GraphPane(props: GraphPaneProps) {
	return (
		<div className={props.className}>
			<Graph
				dotSrc={props.dotSrc}
				format={props.format}
				engine={props.engine}
			/>
		</div>
	);
}
