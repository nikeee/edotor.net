import * as languageService from "dot-language-support";
import {
	MonacoToProtocolConverter,
	ProtocolToMonacoConverter,
	MonacoCommands,
	TextDocument,
	MonacoServices,
} from "monaco-languageclient";
import * as monaco from "monaco-editor";
import { tokenConfig } from "./xdot"

const LANGUAGE_ID = "dot";

const m2p = new MonacoToProtocolConverter();
const p2m = new ProtocolToMonacoConverter();
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
			mimetypes: ["text/vnd.graphviz"]
		},
		monarchTokens: tokenConfig as any as monaco.languages.IMonarchLanguage,
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
				{ open: "\"", close: "\"", notIn: ["string"] },
			],
		},
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

				// Assert non-null/undefined because monaco is not null-aware
				// Assert types because monaco-languageclient has different types than monaco-editor
				return p2m.asWorkspaceEdit(workspaceEdit)! as monaco.languages.WorkspaceEdit;
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
				// Assert types because monaco-languageclient has different types than monaco-editor
				return p2m.asCodeActions(commands) as monaco.languages.CodeAction[];
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
					? p2m.asColorPresentations(res)
					: [];
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
		langs.setMonarchTokensProvider(id, service.monarchTokens);
	if (service.languageConfig)
		langs.setLanguageConfiguration(id, service.languageConfig);
}


export function registerCommands(editor: monaco.editor.IStandaloneCodeEditor) {
	const cmds = new MonacoCommands(editor as any);
	// MonacoServices.install(editor as any);

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
