import type { ItemMenuItem } from "./components/ItemMenu.js";
import type { SupportedEngine, SupportedFormat } from "./rendering.js";

// Defined in https://github.com/mdaines/viz.js/wiki/API#render-options
// TODO: See: https://github.com/mdaines/viz.js/issues/142
export const supportedEngines: SupportedEngine[] = [
	"circo",
	"dot",
	"fdp",
	"neato",
	"osage",
	"twopi",
];

export function isSupportedEngine(v: string | null): v is SupportedEngine {
	return !!v && supportedEngines.indexOf(v as SupportedEngine) >= 0;
}

export const displayFormats: readonly ItemMenuItem<ExportableFormat>[] = [
	{ value: "svg", display: "SVG Image" },
	{ value: "png", display: "PNG Image" },
	{ value: "gv", display: "Source" },
];

export type ExportableFormat = SupportedFormat | "gv";
