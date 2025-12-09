import { editor, languages } from "monaco-editor/esm/vs/editor/editor.api.js";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import type React from "react";

import { registerCommands, service } from "../dot-monaco/index.js";

languages.register(service.language);
languages.setMonarchTokensProvider("dot", service.monarchTokens);
languages.setLanguageConfiguration("dot", service.languageConfig);
languages.registerCompletionItemProvider("dot", service.completionItemProvider);
languages.registerHoverProvider("dot", service.hoverProvider);
languages.registerDefinitionProvider("dot", service.definitionProvider);
languages.registerReferenceProvider("dot", service.referenceProvider);
languages.registerRenameProvider("dot", service.renameProvider);
languages.registerCodeActionProvider("dot", service.codeActionProvider);
languages.registerColorProvider("dot", service.colorProvider);
// TODO: Check if we have other providers to register (or if we can implement some)

self.MonacoEnvironment = {
	getWorker(_: unknown, _label: string) {
		return new editorWorker();
	},
};

export type EditorProps = {
	initialValue?: string | undefined;
	onChangeValue: (value: string) => editor.IMarkerData[];
	onValueError: (errorCount: number) => void;
	ref?: React.Ref<editor.IStandaloneCodeEditor | null>;
};

export default function Editor({
	initialValue,
	onChangeValue,
	onValueError,
	ref,
}: EditorProps) {
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
			}}
			ref={div => {
				if (!div) {
					if (typeof ref === "function") {
						ref(null);
					} else if (ref && "current" in ref) {
						ref.current = null;
					}
					return;
				}

				const e = editor.create(div, {
					value: initialValue,
					language: "dot",
					lineNumbers: "on",
					wordWrap: "on",
					roundedSelection: false,
					scrollBeyondLastLine: false,
					minimap: { enabled: false },
					automaticLayout: true,
				});

				if (typeof ref === "function") {
					ref(e);
				} else if (ref && "current" in ref) {
					ref.current = e;
				}

				registerCommands(e);

				e.focus();

				const model = e.getModel();
				if (model === null) {
					import.meta.env.DEV && console.log("Model is null");

					return () => {
						if (typeof ref === "function") {
							ref(null);
						} else if (ref && "current" in ref) {
							ref.current = null;
						}
						e?.dispose();
					};
				}

				model.onDidChangeContent(() => {
					const newMarkers = onChangeValue?.(model.getValue());
					if (!newMarkers) {
						return;
					}
					editor.setModelMarkers(model, "dot", newMarkers);

					if (newMarkers.length > 0) {
						onValueError(newMarkers.length);
					}
				});

				return () => {
					model.dispose();
					if (typeof ref === "function") {
						ref(null);
					} else if (ref && "current" in ref) {
						ref.current = null;
					}
					e?.dispose();
				};
			}}
		></div>
	);
}
