import { editor, languages } from "monaco-editor/esm/vs/editor/editor.api.js";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

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
};

export default function Editor({
	initialValue,
	onChangeValue,
	onValueError,
}: EditorProps) {
	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
			}}
			ref={div => {
				if (!div) {
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

				registerCommands(e);

				e.focus();

				const model = e.getModel();
				if (model === null) {
					import.meta.env.DEV && console.log("Model is null");
					return () => e?.dispose();
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
					e?.dispose();
				};
			}}
		></div>
	);
}
