const SPLIT_POS_NAME = "splitPos";
const LAST_SOURCE = "lastSource";

export function saveSplitConfig(size?: string | number): void {
	if (size)
		localStorage.setItem(SPLIT_POS_NAME, size.toString());
	else
		localStorage.removeItem(SPLIT_POS_NAME);
};

export function getSplitConfig(): number | undefined {
	const splitPos = localStorage.getItem(SPLIT_POS_NAME);
	return splitPos ? parseInt(splitPos, 10) : undefined;
}

export function saveLastSource(lastSource: string | undefined): void {
	if (lastSource)
		return localStorage.setItem(LAST_SOURCE, lastSource);
	return localStorage.removeItem(LAST_SOURCE);
}
export function getLastSource(): string | undefined {
	return localStorage.getItem(LAST_SOURCE) || undefined;
}
