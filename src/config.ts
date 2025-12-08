import type { SupportedEngine } from "./rendering.js";
import type { ShareData } from "./utils.js";
import { isSupportedEngine } from "./viz/index.js";

const SPLIT_POS_NAME = "splitPos";
const LAST_SOURCE = "lastSource";
const LAST_ENGINE = "lastEngine";

export function saveSplitConfig(size?: string | number): void {
	if (size) localStorage.setItem(SPLIT_POS_NAME, size.toString());
	else localStorage.removeItem(SPLIT_POS_NAME);
}

export function getSplitConfig(): number | undefined {
	const splitPos = localStorage.getItem(SPLIT_POS_NAME);
	return splitPos ? Number(splitPos) : undefined;
}

export function saveLastSource(lastSource: string | undefined): void {
	if (lastSource) {
		localStorage.setItem(LAST_SOURCE, lastSource);
	} else {
		localStorage.removeItem(LAST_SOURCE);
	}
}
function getLastSource(): string | undefined {
	return localStorage.getItem(LAST_SOURCE) ?? undefined;
}

export function saveLastEngine(lastEngine: SupportedEngine | undefined): void {
	if (lastEngine) {
		localStorage.setItem(LAST_ENGINE, lastEngine);
	} else {
		localStorage.removeItem(LAST_ENGINE);
	}
}
function getLastEngine(): SupportedEngine | undefined {
	const e = localStorage.getItem(LAST_ENGINE);
	return isSupportedEngine(e) ? e : undefined;
}

export function saveLastState(state: ShareData) {
	saveLastEngine(state.engine);
	saveLastSource(state.source);
}

export function getLastState(): Partial<ShareData> {
	return {
		source: getLastSource(),
		engine: getLastEngine(),
	};
}

export function mergeStates(a: Partial<ShareData>, b: Partial<ShareData>) {
	return {
		source: a.source ?? b.source,
		engine: a.engine ?? b.engine,
	};
}
