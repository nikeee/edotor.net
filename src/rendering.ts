import Viz from "viz.js";
import workerURL from "viz.js/full.render.js";
import { assertNever } from "./utils";
import { FileSaver } from "./FileSaver";

const createViz = () => new Viz({ workerURL });

let viz = createViz();

export type SupportedFormat = "svg" | "png";
export type SupportedEngine = "circo" | "dot" | "fdp" | "neato" | "osage" | "twopi";
export type Rendering = SVGSVGElement | HTMLImageElement;

export function renderElement(dotSrc: string, format: "svg", engine: SupportedEngine): Promise<SVGSVGElement>;
export function renderElement(dotSrc: string, format: "png", engine: SupportedEngine): Promise<HTMLImageElement>;
export function renderElement(dotSrc: string, format: SupportedFormat, engine: SupportedEngine): Promise<Rendering>;
export function renderElement(dotSrc: string, format: SupportedFormat, engine: SupportedEngine): Promise<Rendering> {
	const renderOptions = {
		engine,
	};

	switch (format) {
		case "svg": return viz.renderSVGElement(dotSrc, renderOptions).catch(catcher);
		case "png": return viz.renderImageElement(dotSrc, { ...renderOptions, mimeType: "image/png" }).catch(catcher);
		// TODO: JPG?
		default: return assertNever(format);
	}
}

/**
 * Catches errors, re-creates the viz object and rethrows
 * @param error
 */
const catcher = (error: Error) => {
	viz = createViz()
	throw error;
};


export interface ExportOptions {
	engine: SupportedEngine;
}

export async function exportAs(dotSrc: string, format: SupportedFormat, options: ExportOptions, saver: FileSaver, fileName: string = "graph"): Promise<void> {
	const totalFileName = fileName + "." + format.toLowerCase();

	const element = await renderElement(dotSrc, format, options.engine);

	if (isSVGElement(element)) {
		const svgData = `<?xml version="1.0" encoding="UTF-8" ?>\n` + element.outerHTML;
		saver.save(svgData, totalFileName);
		return;
	}

	const imageElement = await renderElement(dotSrc, format, options.engine);
	saver.saveImage(element, totalFileName);
}

export function saveSource(dotSrc: string, saver: FileSaver, fileName: string = "graph") {
	saver.save(dotSrc, fileName + ".dot");
}

const isSVGElement = (r: Rendering): r is SVGSVGElement => r instanceof SVGSVGElement;
