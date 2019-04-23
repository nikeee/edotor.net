export const assertNever = (e: never): never => {
	throw new Error("This should never happen.");
}

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
}

/**
 * Returns the full address of the page. Without the hash.
 */
export const getFullUrl = (): string => {
	const fullUrl = !!document.location ? document.location.href : "";
	const hashIndex = fullUrl.indexOf("#");
	return hashIndex < 0
		? fullUrl
		: fullUrl.substring(0, hashIndex);
};

/**
 * Creates a link to the source by encoding it in the window.location.hash.
 * @param sourceToShare The source to encode.
 */
export const getShareUrl = (sourceToShare: string): string => {
	return getFullUrl() + "#" + encodeURIComponent(sourceToShare);
}

/**
 * Gets the source that is provided via window.location.hash, if any
 */
export const getSourceFromUrl = (): string | undefined => {
	const hash = window.location.hash;
	if (!hash || hash === "#")
		return undefined;

	const source = hash.substring(1);
	return !!source
		? decodeURIComponent(source)
		: undefined;
};
