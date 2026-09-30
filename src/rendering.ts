import { instance } from "@viz-js/viz";

import type { FileSaver } from "./FileSaver.js";
import { assertNever } from "./utils.js";

const viz = instance();

export type SupportedFormat = "svg" | "png";
export type SupportedEngine = "circo" | "dot" | "fdp" | "neato" | "osage" | "twopi";
export type RenderResult = SVGSVGElement | HTMLImageElement;

export async function renderElement(
	dotSrc: string,
	format: "svg",
	engine: SupportedEngine,
): Promise<SVGSVGElement>;
export async function renderElement(
	dotSrc: string,
	format: "png",
	engine: SupportedEngine,
): Promise<HTMLImageElement>;
export async function renderElement(
	dotSrc: string,
	format: SupportedFormat,
	engine: SupportedEngine,
): Promise<RenderResult>;
export async function renderElement(
	dotSrc: string,
	format: SupportedFormat,
	engine: SupportedEngine,
): Promise<RenderResult> {
	const v = await viz;
	switch (format) {
		case "svg":
			return v.renderSVGElement(dotSrc, { engine });
		case "png":
			return await svgToPng(v.renderSVGElement(dotSrc, { engine }));
		// TODO: JPG?
		default:
			return assertNever(format);
	}
}

async function svgToPng(svg: SVGSVGElement): Promise<HTMLImageElement> {
	const svgImage = new Image();
	svgImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`;
	await svgImage.decode();

	const scale = 2;
	const canvas = document.createElement("canvas");
	canvas.width = svgImage.width * scale;
	canvas.height = svgImage.height * scale;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Failed to get 2D context from canvas");
	}
	context.drawImage(svgImage, 0, 0, canvas.width, canvas.height);

	const png = new Image();
	png.src = canvas.toDataURL("image/png");
	await png.decode();
	return png;
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

export function saveSource(dotSrc: string, saver: FileSaver, fileName = "graph") {
	saver.save(dotSrc, `${fileName}.gv`);
}

const isSVGElement = (r: RenderResult): r is SVGSVGElement => r instanceof SVGSVGElement;
