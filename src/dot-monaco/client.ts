import * as languageService from "dot-language-support";
import * as monaco from "monaco-editor";
import { TextDocument } from "monaco-languageclient";

import * as m2p from "./monaco-to-protocol.js";
import * as p2m from "./protocol-to-monaco.js";
import tokenConfig from "./xdot";

type Monaco = typeof monaco;

const LANGUAGE_ID = "dot";

const ls = languageService.createService();

export interface MonacoService {
	processor: LanguageProcessor;
	language: monaco.languages.ILanguageExtensionPoint;
	monarchTokens?: monaco.languages.IMonarchLanguage;
	languageConfig?: monaco.languages.LanguageConfiguration;
	completionItemProvider?: monaco.languages.CompletionItemProvider;
	hoverProvider?: monaco.languages.HoverProvider;
	definitionProvider?: monaco.languages.DefinitionProvider;
	referenceProvider?: monaco.languages.ReferenceProvider;
	renameProvider?: monaco.languages.RenameProvider;
	codeActionProvider?: monaco.languages.CodeActionProvider;
	colorProvider?: monaco.languages.DocumentColorProvider;
}

export interface LanguageProcessor {
	process(model: monaco.editor.IReadOnlyModel): ParsedDocument;
	validate(document: ParsedDocument): monaco.editor.IMarkerData[];
	processAndValidate(
		model: monaco.editor.IReadOnlyModel,
	): monaco.editor.IMarkerData[];
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
		const diagnostics = ls.validateDocument(doc.document, doc.sourceFile);
		return p2m.asDiagnostics(diagnostics);
	},
	processAndValidate(model) {
		const doc = this.process(model);
		return this.validate(doc);
	},
};

interface ParsedDocument {
	document: TextDocument;
	sourceFile: languageService.SourceFile;
}

export function createService(): MonacoService {
	return {
		language: {
			id: LANGUAGE_ID,
			extensions: [".dot", ".gv"],
			aliases: ["DOT", "dot", "Graphviz"],
			mimetypes: ["text/vnd.graphviz"],
		},
		monarchTokens: tokenConfig as unknown as monaco.languages.IMonarchLanguage,
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
			provideCompletionItems(
				model: monaco.editor.ITextModel,
				position: monaco.Position,
			) {
				const data = processor.process(model);

				const completions = ls.getCompletions(
					data.document,
					data.sourceFile,
					m2p.asPosition(position.lineNumber, position.column),
				);

				// p2m.asCompletionResult has a bug
				const defaultMonacoRange = monaco.Range.fromPositions(position);
				return {
					incomplete: false,
					suggestions: completions.map(item =>
						p2m.asCompletionItem(item, defaultMonacoRange, undefined),
					),
				};
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
					m2p.asCodeActionContext(context, []),
				);

				return commands ? p2m.asCodeActionList(commands) : null;
			},
		},
		colorProvider: {
			provideDocumentColors(model) {
				const data = processor.process(model);
				const res = ls.getDocumentColors(data.document, data.sourceFile);

				// TODO: Create PR for this kind
				return res
					? res.map(c => ({
							range: p2m.asRange(c.range),
							color: c.color,
						}))
					: [];
			},
			provideColorPresentations(model, colorInfo) {
				const data = processor.process(model);

				const color = colorInfo.color;
				const range = m2p.asRange(colorInfo.range);
				const res = ls.getColorRepresentations(
					data.document,
					data.sourceFile,
					color,
					range,
				);

				return res ? p2m.asColorPresentations(res) : [];
			},
		},
		processor,
	};
}

export function registerService(context: Monaco, service: MonacoService): void {
	if (!service.language) return;

	const langs = context.languages;
	const id = service.language.id;

	langs.register(service.language);

	if (service.completionItemProvider)
		langs.registerCompletionItemProvider(id, service.completionItemProvider);
	if (service.hoverProvider)
		langs.registerHoverProvider(id, service.hoverProvider);
	if (service.definitionProvider)
		langs.registerDefinitionProvider(id, service.definitionProvider);
	if (service.referenceProvider)
		langs.registerReferenceProvider(id, service.referenceProvider);
	if (service.renameProvider)
		langs.registerRenameProvider(id, service.renameProvider);
	if (service.codeActionProvider)
		langs.registerCodeActionProvider(id, service.codeActionProvider);
	if (service.colorProvider)
		langs.registerColorProvider(id, service.colorProvider);
	if (service.monarchTokens)
		langs.setMonarchTokensProvider(id, service.monarchTokens);
	if (service.languageConfig)
		langs.setLanguageConfiguration(id, service.languageConfig);
}

export function registerCommands(editor: monaco.editor.IStandaloneCodeEditor) {
	for (const command of ls.getAvailableCommands()) {
		monaco.editor.registerCommand(command, (_accessor, ...args: unknown[]) => {
			const m = editor.getModel();
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
