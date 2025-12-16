import * as Viz from "@viz-js/viz";

import type { FileSaver } from "./FileSaver.js";
import { assertNever } from "./utils.js";
import { sourceFormatExtension } from "./viz.js";

const viz = await Viz.instance();

export type SupportedFormat = "svg" | "png";
export type SupportedEngine =
	| "circo"
	| "dot"
	| "fdp"
	| "neato"
	| "osage"
	| "twopi";
export type RenderResult = SVGSVGElement | HTMLImageElement;

export function renderElement(
	dotSrc: string,
	format: "svg",
	engine: SupportedEngine,
): Promise<SVGSVGElement>;
export function renderElement(
	dotSrc: string,
	format: "png",
	engine: SupportedEngine,
): Promise<HTMLImageElement>;
export function renderElement(
	dotSrc: string,
	format: SupportedFormat,
	engine: SupportedEngine,
): Promise<RenderResult>;
export function renderElement(
	dotSrc: string,
	format: SupportedFormat,
	engine: SupportedEngine,
): Promise<RenderResult> {
	const renderOptions = {
		engine,
	};

	switch (format) {
		case "svg":
			return Promise.resolve(viz.renderSVGElement(dotSrc, renderOptions));
		case "png":
			throw new Error("PNG rendering not yet implemented");
		// TODO: JPG?
		default:
			return assertNever(format);
	}
}

export interface ExportOptions {
	engine: SupportedEngine;
}

export async function exportAs(
	dotSrc: string,
	format: SupportedFormat,
	options: ExportOptions,
	saver: FileSaver,
	fileName = "graph",
): Promise<void> {
	const totalFileName = `${fileName}.${format.toLowerCase()}`;

	const element = await renderElement(dotSrc, format, options.engine);

	if (isSVGElement(element)) {
		const svgData = `<?xml version="1.0" encoding="UTF-8" ?>\n${element.outerHTML}`;
		saver.save(svgData, totalFileName);
		return;
	}

	const _imageElement = await renderElement(dotSrc, format, options.engine);
	saver.saveImage(element, totalFileName);
}

export function saveSource(
	dotSrc: string,
	saver: FileSaver,
	fileName = "graph",
) {
	saver.save(dotSrc, `${fileName}.${sourceFormatExtension}`);
}

const isSVGElement = (r: RenderResult): r is SVGSVGElement =>
	r instanceof SVGSVGElement;
