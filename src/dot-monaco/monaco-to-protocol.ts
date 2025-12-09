import {
	type editor,
	type IRange,
	type languages,
	MarkerSeverity,
} from "monaco-editor";
import type * as lst from "vscode-languageserver-types";

export function asPosition(lineNumber: number, column: number): lst.Position {
	// Monaco uses 1-based line numbers, LSP uses 0-based
	// Monaco uses 1-based column numbers, LSP uses 0-based character offsets
	return {
		line: lineNumber - 1,
		character: column - 1,
	};
}

export function asRange(range: IRange): lst.Range {
	return {
		start: asPosition(range.startLineNumber, range.startColumn),
		end: asPosition(range.endLineNumber, range.endColumn),
	};
}

export function asDiagnosticSeverity(
	severity: MarkerSeverity,
): lst.DiagnosticSeverity {
	// Monaco MarkerSeverity: Error=8, Warning=4, Info=2, Hint=1
	// LSP DiagnosticSeverity: Error=1, Warning=2, Information=3, Hint=4
	switch (severity) {
		case MarkerSeverity.Error:
			return 1;
		case MarkerSeverity.Warning:
			return 2;
		case MarkerSeverity.Info:
			return 3;
		case MarkerSeverity.Hint:
			return 4;
		default:
			return 1;
	}
}

export function asDiagnostics(markers: editor.IMarkerData[]): lst.Diagnostic[] {
	return markers.map(marker => ({
		range: asRange({
			startLineNumber: marker.startLineNumber,
			startColumn: marker.startColumn,
			endLineNumber: marker.endLineNumber,
			endColumn: marker.endColumn,
		}),
		severity: asDiagnosticSeverity(marker.severity),
		code:
			typeof marker.code === "string" || typeof marker.code === "number"
				? marker.code
				: undefined,
		source: marker.source,
		message: marker.message,
	}));
}

export function asCodeActionContext(
	context: languages.CodeActionContext,
	diagnostics?: lst.Diagnostic[],
): lst.CodeActionContext {
	return {
		diagnostics:
			diagnostics && diagnostics.length > 0
				? diagnostics
				: asDiagnostics(context.markers),
		only: context.only
			? Array.isArray(context.only)
				? context.only
				: [context.only]
			: undefined,
	};
}
