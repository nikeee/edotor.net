import * as lst from "vscode-languageserver-types";

/**
 * Represents a color range from a document.
 */
export interface ColorInformation {
	/**
	 * The range in the document where this color appers.
	 */
	range: lst.Range;
	/**
	 * The actual color value for this color range.
	 */
	color: Color;
}
/**
 * Represents a color in RGBA space.
 */
export interface Color {
	/**
	 * The red component of this color in the range [0-1].
	 */
	readonly red: number;
	/**
	 * The green component of this color in the range [0-1].
	 */
	readonly green: number;
	/**
	 * The blue component of this color in the range [0-1].
	 */
	readonly blue: number;
	/**
	 * The alpha component of this color in the range [0-1].
	 */
	readonly alpha: number;
}

export interface ColorPresentation {
	/**
	 * The label of this color presentation. It will be shown on the color
	 * picker header. By default this is also the text that is inserted when selecting
	 * this color presentation.
	 */
	label: string;
	/**
	 * An [edit](#TextEdit) which is applied to a document when selecting
	 * this presentation for the color.  When `falsy` the [label](#ColorPresentation.label)
	 * is used.
	 */
	textEdit?: lst.TextEdit;
	/**
	 * An optional array of additional [text edits](#TextEdit) that are applied when
	 * selecting this color presentation. Edits must not overlap with the main [edit](#ColorPresentation.textEdit) nor with themselves.
	 */
	additionalTextEdits?: lst.TextEdit[];
}
