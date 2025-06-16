import { fromUint8Array, toUint8Array } from "js-base64";
import { deflate, inflate } from "pako";
import type { SupportedEngine } from "./rendering";
import { isSupportedEngine } from "./viz";

export const assertNever = (_: never): never => {
	throw new Error("This should never happen.");
};

export function removeChildren(container: HTMLElement): void {
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}

/**
 * Copies text to the clipboard by using a temporary element
 */
export const copyToClipboard = (text: string): void => {
	const ta = document.createElement("textarea");
	ta.style.height = "0";
	ta.style.width = "0";
	document.body.appendChild(ta);
	try {
		ta.value = text;
		ta.select();
		document.execCommand("copy");
	} finally {
		document.body.removeChild(ta);
	}
};

/**
 * Returns the full address of the page. Without the hash.
 */
export const getFullUrl = (): string => {
	const fullUrl = document.location ? document.location.href : "";
	const hashIndex = fullUrl.indexOf("#");
	return hashIndex < 0 ? fullUrl : fullUrl.substring(0, hashIndex);
};

/**
 * Creates a link to the source by encoding it in the window.location.hash.
 * @param sourceToShare The source to encode.
 */
export const getShareUrl = (data: ShareData): string => {
	return `${getFullUrl()}?engine=${encodeURIComponent(data.engine)}#deflate:${fromUint8Array(deflate(data.source, { level: 9 }))}`;
};

/**
 * Gets the source that is provided via window.location.hash, if any
 */
export const getSourceFromUrl = (url: URL): Partial<ShareData> => {
	const passedEndinge = url.searchParams.get("engine");
	const engine = isSupportedEngine(passedEndinge) ? passedEndinge : undefined;

	if (!url.hash || url.hash === "#") {
		return {
			source: undefined,
			engine,
		};
	}

	let source: string | undefined = url.hash.substring(1);
	if (source.startsWith("deflate:")) {
		source = tryInflate(source.substring("deflate:".length));
	} else {
		source = source ? decodeURIComponent(source) : undefined;
	}

	return {
		source,
		engine,
	};
};

function tryInflate(base64Content: string): string | undefined {
	try {
		return inflate(toUint8Array(base64Content), { to: "string" });
	} catch (e) {
		console.error(`Failed to decode the compressed deflate source: ${e}`);
		return undefined;
	}
}

export interface ShareData {
	source: string;
	engine: SupportedEngine;
}
