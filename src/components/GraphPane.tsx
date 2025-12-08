import { Graph, type Props as GraphProps } from "./Graph.js";

import "./GraphPane.css";

interface Props extends GraphProps {
	className?: string;
}

export const GraphPane = (props: Props) => {
	return (
		<div className={props.className}>
			<Graph
				dotSrc={props.dotSrc}
				format={props.format}
				engine={props.engine}
			/>
		</div>
	);
};
