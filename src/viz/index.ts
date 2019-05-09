import { SupportedEngine, SupportedFormat } from "../rendering";
import { ItemMenuItem } from "../components/ItemMenu";

export const sourceFormatName = "Source";
export const sourceFormatExtension = "gv";


// Defined in https://github.com/mdaines/viz.js/wiki/API#render-options
// TODO: See: https://github.com/mdaines/viz.js/issues/142
export const supportedEngines: SupportedEngine[] = ["circo", "dot", "fdp", "neato", "osage", "twopi"];

export const supportedFormats: SupportedFormat[] = ["svg", "png"];

export const displayFormats: readonly ItemMenuItem<ExportableFormat>[] = [
	{ value: "svg", display: "SVG Image" },
	{ value: "png", display: "PNG Image" },
	{ value: sourceFormatExtension, display: sourceFormatName },
];

export type ExportableFormat = SupportedFormat | typeof sourceFormatExtension;
