import { type Viz, instance as createVizInstance } from "@viz-js/viz";
import { use } from "react";

const instancePromise = createVizInstance();
export default function useGraphViz(): Viz {
	return use(instancePromise);
}
