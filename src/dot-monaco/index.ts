import { createService, type SourceFile } from "dot-language-support";
import { editor, type languages, type Position } from "monaco-editor";
import { TextDocument } from "vscode-languageserver-textdocument";

import * as m2p from "./monaco-to-protocol.js";
import * as p2m from "./protocol-to-monaco.js";
import tokenConfig from "./xdot";

const LANGUAGE_ID = "dot";

const ls = createService();

export interface MonacoService {
	processor: LanguageProcessor;
	language: languages.ILanguageExtensionPoint;
	monarchTokens: languages.IMonarchLanguage;
	languageConfig: languages.LanguageConfiguration;
	completionItemProvider: languages.CompletionItemProvider;
	hoverProvider: languages.HoverProvider;
	definitionProvider: languages.DefinitionProvider;
	referenceProvider: languages.ReferenceProvider;
	renameProvider: languages.RenameProvider;
	codeActionProvider: languages.CodeActionProvider;
	colorProvider: languages.DocumentColorProvider;
}

export interface LanguageProcessor {
	process(model: editor.IReadOnlyModel): ParsedDocument;
	validate(document: ParsedDocument): editor.IMarkerData[];
	processAndValidate(model: editor.IReadOnlyModel): editor.IMarkerData[];
}

const processor: LanguageProcessor = {
	process(model): ParsedDocument {
		const document = TextDocument.create(
			model.uri.toString(),
			model.id,
			model.getVersionId(),
			model.getValue(),
		);
		return {
			document,
			sourceFile: ls.parseDocument(document),
		};
	},
	validate(doc: ParsedDocument) {
		return p2m.asDiagnostics(ls.validateDocument(doc.document, doc.sourceFile));
	},
	processAndValidate(model) {
		const doc = this.process(model);
		return this.validate(doc);
	},
};

interface ParsedDocument {
	document: TextDocument;
	sourceFile: SourceFile;
}

export const service = {
	language: {
		id: LANGUAGE_ID,
		extensions: [".dot", ".gv"],
		aliases: ["DOT", "dot", "Graphviz"],
		mimetypes: ["text/vnd.graphviz"],
	},
	monarchTokens: tokenConfig as unknown as languages.IMonarchLanguage,
	languageConfig: {
		wordPattern: /(-?\d*\.\d*)|(\w+[0-9]*)/,
		// Takem from: https://github.com/Microsoft/monaco-json/blob/master/src/jsonMode.ts#L42-L60
		comments: {
			lineComment: "//",
			blockComment: ["/*", "*/"],
		},
		brackets: [
			["{", "}"],
			["[", "]"],
		],
		autoClosingPairs: [
			{ open: "{", close: "}", notIn: ["string"] },
			{ open: "[", close: "]", notIn: ["string"] },
			{ open: '"', close: '"', notIn: ["string"] },
		],
	},
	completionItemProvider: {
		triggerCharacters: ["=", ",", "["],
		provideCompletionItems(model: editor.ITextModel, position: Position) {
			const data = processor.process(model);

			const completions = ls.getCompletions(
				data.document,
				data.sourceFile,
				m2p.asPosition(position.lineNumber, position.column),
			);

			return p2m.asCompletionResult(completions);
		},
	},
	hoverProvider: {
		provideHover(model, position) {
			const data = processor.process(model);

			const hover = ls.hover(
				data.document,
				data.sourceFile,
				m2p.asPosition(position.lineNumber, position.column),
			);
			return p2m.asHover(hover);
		},
	},
	definitionProvider: {
		provideDefinition(model, position) {
			const data = processor.process(model);

			const definition = ls.findDefinition(
				data.document,
				data.sourceFile,
				m2p.asPosition(position.lineNumber, position.column),
			);
			return p2m.asDefinitionResult(definition);
		},
	},
	referenceProvider: {
		provideReferences(model, position, context) {
			const data = processor.process(model);

			const refs = ls.findReferences(
				data.document,
				data.sourceFile,
				m2p.asPosition(position.lineNumber, position.column),
				context,
			);
			return p2m.asReferences(refs);
		},
	},
	renameProvider: {
		provideRenameEdits(model, position, newName) {
			const data = processor.process(model);

			const workspaceEdit = ls.renameSymbol(
				data.document,
				data.sourceFile,
				m2p.asPosition(position.lineNumber, position.column),
				newName,
			);
			return p2m.asWorkspaceEdit(workspaceEdit);
		},
	},
	codeActionProvider: {
		provideCodeActions(model, range, context) {
			const data = processor.process(model);

			const commands = ls.getCodeActions(
				data.document,
				data.sourceFile,
				m2p.asRange(range),
				m2p.asCodeActionContext(context),
			);
			return p2m.asCodeActionList(commands);
		},
	},
	colorProvider: {
		provideDocumentColors(model) {
			const data = processor.process(model);
			const res = ls.getDocumentColors(data.document, data.sourceFile);

			return p2m.asColorInformation(res);
		},
		provideColorPresentations(model, colorInfo) {
			const data = processor.process(model);

			const res = ls.getColorRepresentations(
				data.document,
				data.sourceFile,
				colorInfo.color,
				m2p.asRange(colorInfo.range),
			);
			return p2m.asColorPresentations(res);
		},
	},
	processor,
} satisfies MonacoService;

// biome-ignore lint/suspicious/noExplicitAny: :todo:
export function registerService(context: any, service: MonacoService): void {
	if (!service.language) {
		return;
	}

	const langs = context.languages;
	const id = service.language.id;

	langs.register(service.language);
	langs.registerCompletionItemProvider(id, service.completionItemProvider);
	langs.registerHoverProvider(id, service.hoverProvider);
	langs.registerDefinitionProvider(id, service.definitionProvider);
	langs.registerReferenceProvider(id, service.referenceProvider);
	langs.registerRenameProvider(id, service.renameProvider);
	langs.registerCodeActionProvider(id, service.codeActionProvider);
	langs.registerColorProvider(id, service.colorProvider);
	langs.setMonarchTokensProvider(id, service.monarchTokens);
	langs.setLanguageConfiguration(id, service.languageConfig);
}

export function registerCommands(instance: editor.IStandaloneCodeEditor) {
	for (const command of ls.getAvailableCommands()) {
		editor.registerCommand(command, (_accessor, ...args: unknown[]) => {
			const m = instance.getModel();
			if (m === null) return;

			const data = processor.process(m);
			const doc = data.document;
			const edits = ls.executeCommand(doc, data.sourceFile, {
				command,
				arguments: args,
			});
			if (edits) {
				const changes = edits.edit.changes;
				if (changes) {
					const modelChanges = changes[doc.uri];
					if (modelChanges) {
						const editOps = modelChanges.map(e => ({
							range: p2m.asRange(e.range),
							text: e.newText,
						}));
						m.pushEditOperations([], editOps, () => []);
					}
				}
			}
		});
	}
}
