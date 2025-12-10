import * as monaco from "monaco-editor";
import type * as ls from "vscode-languageserver-types";

export function asPosition(value: undefined | null): undefined;
export function asPosition(value: ls.Position): monaco.Position;
export function asPosition(
	value: ls.Position | undefined | null,
): monaco.Position | undefined;
export function asPosition(
	value: ls.Position | undefined | null,
): monaco.Position | undefined {
	return value ? new monaco.Position(value.line, value.character) : undefined;
}

export function asRange(value: undefined | null): undefined;
export function asRange(value: ls.Range): monaco.Range;
export function asRange(
	value: ls.Range | undefined | null,
): monaco.Range | undefined;
export function asRange(
	value: ls.Range | undefined | null,
): monaco.Range | undefined {
	return value
		? new monaco.Range(
				value.start.line + 1,
				value.start.character + 1,
				value.end.line + 1,
				value.end.character + 1,
			)
		: undefined;
}

export function asDiagnostics(
	diagnostics: ls.Diagnostic[],
): monaco.editor.IMarkerData[] {
	return diagnostics.map(diagnostic => {
		const range = asRange(diagnostic.range);
		return {
			severity: asSeverity(diagnostic.severity),
			startLineNumber: range.startLineNumber,
			startColumn: range.startColumn,
			endLineNumber: range.endLineNumber,
			endColumn: range.endColumn,
			message: diagnostic.message,
			code:
				typeof diagnostic.code === "string"
					? diagnostic.code
					: String(diagnostic.code || ""),
			source: diagnostic.source,
			tags: diagnostic.tags,
		};
	});
}

export function asCompletionList(
	completions: ls.CompletionItem[] | null | undefined,
	position: monaco.Position,
): monaco.languages.CompletionList {
	const defaultMonacoRange = monaco.Range.fromPositions(position);
	return {
		incomplete: false,
		suggestions: (completions ?? []).map(item =>
			asCompletionItem(item, defaultMonacoRange, undefined),
		),
	};
}

export function asCompletionResult(
	result: ls.CompletionItem[] | null | undefined,
): monaco.languages.CompletionList {
	if (!result) {
		return {
			incomplete: false,
			suggestions: [],
		};
	}
	const suggestions = result.map(item =>
		asCompletionItem(item, undefined, undefined),
	);
	return {
		incomplete: false,
		suggestions,
	};
}

export function asCompletionItem(
	item: ls.CompletionItem,
	defaultRange: monaco.IRange | undefined,
	insertTextReplaceRange?: monaco.IRange,
): monaco.languages.CompletionItem {
	const textEdit = item.textEdit;
	const range =
		textEdit && "range" in textEdit
			? asRange(textEdit.range)
			: textEdit && "insert" in textEdit
				? asRange(textEdit.insert)
				: // biome-ignore lint/style/noNonNullAssertion: :shrug: #119
					insertTextReplaceRange || defaultRange!;

	const documentation = asDocumentation(item.documentation);

	const result: monaco.languages.CompletionItem = {
		label: item.label,
		kind:
			item.kind !== undefined
				? asCompletionItemKind(item.kind)
				: monaco.languages.CompletionItemKind.Text,
		detail: item.detail,
		documentation,
		insertText:
			(textEdit && "newText" in textEdit ? textEdit.newText : undefined) ||
			item.insertText ||
			item.label,
		insertTextRules:
			item.insertTextFormat === 2
				? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
				: undefined,
		range,
		sortText: item.sortText,
		filterText: item.filterText,
		preselect: item.preselect,
		additionalTextEdits: item.additionalTextEdits?.map(edit => ({
			range: asRange(edit.range),
			text: edit.newText,
		})),
		command: item.command as monaco.languages.Command | undefined,
		commitCharacters: item.commitCharacters,
	};

	return result;
}

export function asHover(hover: null | undefined): null;
export function asHover(hover: ls.Hover): monaco.languages.Hover;
export function asHover(
	hover: ls.Hover | null | undefined,
): monaco.languages.Hover | null;
export function asHover(
	hover: ls.Hover | null | undefined,
): monaco.languages.Hover | null {
	return hover
		? {
				contents: asHoverContents(hover.contents),
				range: hover.range ? asRange(hover.range) : undefined,
			}
		: null;
}

export function asDefinitionResult(
	definition: ls.Location | ls.Location[] | null | undefined,
): monaco.languages.Definition | null {
	if (!definition) {
		return null;
	}

	if (Array.isArray(definition)) {
		return definition.map(loc => asLocation(loc));
	}

	return asLocation(definition);
}

export function asReferences(
	references: ls.Location[] | null | undefined,
): monaco.languages.Location[] {
	return references?.map(ref => asLocation(ref)) ?? [];
}

function asLocation(location: ls.Location): monaco.languages.Location {
	return {
		uri: monaco.Uri.parse(location.uri),
		range: asRange(location.range),
	};
}

export function asWorkspaceEdit(
	edit: ls.WorkspaceEdit | null | undefined,
): monaco.languages.WorkspaceEdit | undefined {
	if (!edit) {
		return undefined;
	}

	const edits: monaco.languages.WorkspaceTextEdit[] = [];

	if (edit.changes) {
		for (const [uri, textEdits] of Object.entries(edit.changes)) {
			for (const textEdit of textEdits) {
				edits.push({
					resource: monaco.Uri.parse(uri),
					edit: {
						range: asRange(textEdit.range),
						text: textEdit.newText,
					},
				});
			}
		}
	}

	return {
		edits,
	};
}

export function asCodeActionList(
	commands: (ls.CodeAction | ls.Command)[] | null | undefined,
): monaco.languages.CodeActionList | null {
	if (!commands) {
		return null;
	}

	const actions: monaco.languages.CodeAction[] = commands.map(command => {
		if (
			"command" in command &&
			typeof command.command === "string" &&
			"arguments" in command
		) {
			const cmd = command as ls.Command;
			return {
				title: cmd.title,
				command: {
					id: cmd.command,
					title: cmd.title,
					arguments: cmd.arguments,
				},
			};
		}

		const codeAction = command as ls.CodeAction;
		const action: monaco.languages.CodeAction = {
			title: codeAction.title,
			kind: codeAction.kind,
			diagnostics: codeAction.diagnostics?.map(d => {
				const range = asRange(d.range);
				return {
					severity: asSeverity(d.severity),
					startLineNumber: range.startLineNumber,
					startColumn: range.startColumn,
					endLineNumber: range.endLineNumber,
					endColumn: range.endColumn,
					message: d.message,
					code: typeof d.code === "string" ? d.code : String(d.code || ""),
					source: d.source,
				};
			}),
			edit: codeAction.edit
				? asWorkspaceEdit(codeAction.edit) || undefined
				: undefined,
			command: codeAction.command as monaco.languages.Command | undefined,
			isPreferred: codeAction.isPreferred,
			disabled: codeAction.disabled?.reason,
		};

		return action;
	});

	return {
		actions,
		dispose: () => {},
	};
}

export function asColorInformation(
	colorInfo: ls.ColorInformation[] | null | undefined,
): monaco.languages.IColorInformation[] {
	if (!colorInfo) {
		return [];
	}

	return colorInfo.map(c => ({
		range: asRange(c.range),
		color: c.color,
	}));
}

export function asColorPresentations(
	presentations: ls.ColorPresentation[] | null | undefined,
): monaco.languages.IColorPresentation[] {
	if (!presentations) {
		return [];
	}

	return presentations.map(presentation => ({
		label: presentation.label,
		textEdit: presentation.textEdit
			? {
					range: asRange(presentation.textEdit.range),
					text: presentation.textEdit.newText,
				}
			: undefined,
		additionalTextEdits: presentation.additionalTextEdits?.map(edit => ({
			range: asRange(edit.range),
			text: edit.newText,
		})),
	}));
}

// Helper functions
function asSeverity(severity?: number): monaco.MarkerSeverity {
	// LSP DiagnosticSeverity: Error=1, Warning=2, Information=3, Hint=4
	// Monaco MarkerSeverity: Error=8, Warning=4, Info=2, Hint=1
	switch (severity) {
		case 1:
			return monaco.MarkerSeverity.Error;
		case 2:
			return monaco.MarkerSeverity.Warning;
		case 3:
			return monaco.MarkerSeverity.Info;
		case 4:
			return monaco.MarkerSeverity.Hint;
		default:
			return monaco.MarkerSeverity.Error;
	}
}

function asCompletionItemKind(
	kind: number,
): monaco.languages.CompletionItemKind {
	// Map LSP CompletionItemKind to Monaco CompletionItemKind
	// LSP and Monaco use the same numeric values, but we'll map them explicitly
	return kind as monaco.languages.CompletionItemKind;
}

function asDocumentation(
	documentation?: string | { value: string; kind?: string },
): monaco.IMarkdownString | string | undefined {
	if (!documentation) {
		return undefined;
	}

	if (typeof documentation === "string") {
		return documentation;
	}

	if (documentation.kind === "markdown") {
		return { value: documentation.value };
	}

	return documentation.value;
}

function asHoverContents(
	contents:
		| string
		| Array<{ value: string; kind?: string } | string>
		| { value: string; kind?: string },
): monaco.IMarkdownString[] {
	if (typeof contents === "string") {
		return [{ value: contents }];
	}

	if (Array.isArray(contents)) {
		return contents.map(c => {
			if (typeof c === "string") {
				return { value: c };
			}
			return {
				value: c.kind === "markdown" ? c.value : c.value,
			};
		});
	}

	return [
		{ value: contents.kind === "markdown" ? contents.value : contents.value },
	];
}
