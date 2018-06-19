import * as languageService from "dot-language-support";
import {
	MonacoToProtocolConverter,
	ProtocolToMonacoConverter,
	MonacoCommands,
	TextDocument,
} from "monaco-languageclient";
import * as monaco from "monaco-editor";
import { tokenConfig } from "./xdot"

const LANGUAGE_ID = "dot";

const m2p = new MonacoToProtocolConverter();
const p2m = new ProtocolToMonacoConverter();
const ls = languageService.createService();

export interface MonacoService {
	language: monaco.languages.ILanguageExtensionPoint;
	processor: LanguageProcessor;
	monarchTokens?: monaco.languages.IMonarchLanguage;
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
	processAndValidate(model: monaco.editor.IReadOnlyModel): monaco.editor.IMarkerData[];
}

function createDocument(model: monaco.editor.IReadOnlyModel) {
	return TextDocument.create(model.uri.toString(), model.getModeId(), model.getVersionId(), model.getValue());
}

const processor: LanguageProcessor = {
	process(model): ParsedDocument {
		const document = createDocument(model);
		return {
			document,
			sourceFile: ls.parseDocument(document),
		};
	},
	validate(doc: ParsedDocument) {
		const diagnostics = ls.validateDocument(doc.document, doc.sourceFile);
		return diagnostics.map(d => p2m.asMarker(d));
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
			mimetypes: ["text/vnd.graphviz"]
		},
		monarchTokens: tokenConfig as any as monaco.languages.IMonarchLanguage,
		completionItemProvider: {
			triggerCharacters: ["="],
			provideCompletionItems(model: monaco.editor.ITextModel, position: monaco.Position) {
				const data = processor.process(model);

				const completions = ls.getCompletions(data.document, data.sourceFile, m2p.asPosition(position.lineNumber, position.column));
				return p2m.asCompletionResult(completions);
			},
			// resolveCompletionItem(item: CompletionItem) {}
		},
		hoverProvider: {
			provideHover(model, position) {
				const data = processor.process(model);

				const hover = ls.hover(data.document, data.sourceFile, m2p.asPosition(position.lineNumber, position.column));
				return p2m.asHover(hover)!; // Assert non-null/undefined because monaco is not null-aware
			}
		},
		definitionProvider: {
			provideDefinition(model, position) {
				const data = processor.process(model);

				const definition = ls.findDefinition(data.document, data.sourceFile, m2p.asPosition(position.lineNumber, position.column));
				return p2m.asDefinitionResult(definition)!; // Assert non-null/undefined because monaco is not null-aware
			}
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
			}
		},
		renameProvider: {
			provideRenameEdits(model, position, newName) {
				const data = processor.process(model);

				const workspaceEdit = ls.renameSymbol(
					data.document,
					data.sourceFile,
					m2p.asPosition(position.lineNumber, position.column),
					newName,
				)
				return p2m.asWorkspaceEdit(workspaceEdit)!; // Assert non-null/undefined because monaco is not null-aware
			}
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

				if (!commands)
					return [];
				/*
								const actions: monaco.languages.CodeAction[] = [];
								for (const cmd of commands) {
									if (cmd) {
										const execution = ls.executeCommand(data.document, data.sourceFile, cmd);
										if (execution) {
											actions.push(cA);
										}
									}
								}
								// const executions = commands.map(cmd => ls.executeCommand(data.document, data.sourceFile, cmd));
								return actions;
				*/
				return p2m.asCodeActions(commands);
			}
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
				const res = ls.getColorRepresentations(data.document, data.sourceFile, color, range);

				return res
					? res.map(c => ({ label: c.label })) // TODO: Create PR for this kind
					: [];
				throw "Not implemented";
			}
		},
		processor,
	};
}

export function registerService(context: typeof monaco, service: MonacoService): void {
	if (!service.language)
		return;

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
		context.languages.setMonarchTokensProvider(id, service.monarchTokens);
}


export function registerCommands(editor: monaco.editor.IStandaloneCodeEditor) {
	const cmds = new MonacoCommands(editor as any);

	for (const command of ls.getAvailableCommands()) {
		cmds.registerCommand(command, (...args: any[]) => {
			const m = editor.getModel();
			const data = processor.process(m);
			const doc = data.document;
			const edits = ls.executeCommand(doc, data.sourceFile, { command, arguments: args });
			if (edits) {
				const changes = edits.edit.changes;
				if (changes) {
					const modelChanges = changes[doc.uri];
					if (modelChanges) {
						const editOps = modelChanges.map(e => ({
							range: p2m.asRange(e.range),
							text: e.newText
						}));
						m.pushEditOperations([], editOps, () => []);
					}
				}
			}
		});
	}
}
