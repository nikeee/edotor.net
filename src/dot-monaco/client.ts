import * as languageService from "dot-language-support";
import * as monaco from "monaco-editor";
import { TextDocument } from "monaco-languageclient";
import tokenConfig from "./xdot";

import { createConverter as createCodeConverter } from "vscode-languageclient/lib/common/codeConverter";
import { createConverter as createProtocolConverter } from "vscode-languageclient/lib/common/protocolConverter";

const m2p = createCodeConverter();
const p2m = createProtocolConverter(undefined, true, true);

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
	validate(document: ParsedDocument): Promise<monaco.editor.IMarkerData[]>;
	processAndValidate(
		model: monaco.editor.IReadOnlyModel,
	): Promise<monaco.editor.IMarkerData[]>;
}

function createDocument(model: monaco.editor.IReadOnlyModel) {
	return TextDocument.create(
		model.uri.toString(),
		model.id,
		model.getVersionId(),
		model.getValue(),
	);
}

const processor: LanguageProcessor = {
	process(model): ParsedDocument {
		const document = createDocument(model);
		return {
			document,
			sourceFile: ls.parseDocument(document),
		};
	},
	async validate(doc: ParsedDocument) {
		const diagnostics = ls.validateDocument(doc.document, doc.sourceFile);
		return await p2m.asDiagnostics(diagnostics);
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
			async provideCompletionItems(
				model: monaco.editor.ITextModel,
				position: monaco.Position,
				token,
			) {
				const data = processor.process(model);

				const completions = ls.getCompletions(
					data.document,
					data.sourceFile,
					m2p.asPosition(position),
				);

				return {
					incomplete: false,
					suggestions: await p2m.asCompletionResult(
						completions,
						undefined,
						token,
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
					m2p.asPosition(position),
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
					m2p.asPosition(position),
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
					m2p.asPosition(position),
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
					m2p.asPosition(position),
					newName,
				);

				return p2m.asWorkspaceEdit(workspaceEdit);
			},
		},
		codeActionProvider: {
			async provideCodeActions(model, range, context, token) {
				const data = processor.process(model);

				const commands = ls.getCodeActions(
					data.document,
					data.sourceFile,
					m2p.asRange(range),
					await m2p.asCodeActionContext(context, token),
				);

				if (!commands) {
					return undefined;
				}

				return await p2m.asCodeActionResult(commands, token);
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
			if (m === null) {
				return;
			}

			const data = processor.process(m);
			const doc = data.document;
			const edits = ls.executeCommand(doc, data.sourceFile, {
				command,
				arguments: args,
			});

			if (!edits) {
				return;
			}

			const changes = edits.edit.changes;
			if (!changes) {
				return;
			}

			const modelChanges = changes[doc.uri];
			if (!modelChanges) {
				return;
			}
			const editOps = modelChanges.map(e => ({
				range: p2m.asRange(e.range),
				text: e.newText,
			}));

			m.pushEditOperations([], editOps, () => []);
		});
	}
}
