import { SupportedEngine, SupportedFormat } from "../rendering";


// Defined in https://github.com/mdaines/viz.js/wiki/API#render-options
// TODO: See: https://github.com/mdaines/viz.js/issues/142
export const supportedEngines: SupportedEngine[] = ["circo", "dot", "fdp", "neato", "osage", "twopi"];

export const supportedFormats: SupportedFormat[] = ["svg", "png"];
export const displayFormats: { [P in SupportedFormat]: string } = {
	"svg": "SVG",
	"png": "PNG",
};
