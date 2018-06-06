const SPLIT_POS_NAME = "splitPos";

export const saveSplitConfig = (size?: string | number): void => {
	if (size)
		localStorage.setItem(SPLIT_POS_NAME, size.toString());
	else
		localStorage.removeItem(SPLIT_POS_NAME);
};

export const getSplitConfig = (): number | undefined => {
	const splitPos = localStorage.getItem(SPLIT_POS_NAME);
	return splitPos ? parseInt(splitPos, 10) : undefined;
}
