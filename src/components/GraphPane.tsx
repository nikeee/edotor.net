import Graph, { type GraphProps } from "./Graph.js";

export interface GraphPaneProps extends GraphProps {
	className?: string;
	hasErrors: boolean;
}

export default function GraphPane(props: GraphPaneProps) {
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				opacity: props.hasErrors ? 0.5 : 1,
			}}
		>
			<Graph
				dotSrc={props.dotSrc}
				format={props.format}
				engine={props.engine}
			/>
		</div>
	);
}
