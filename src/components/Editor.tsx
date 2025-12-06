import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

import "./importWorker";
import { registerCommands } from "../dot-monaco";

export type EditorProps = {
	initialValue?: string | undefined;
	onChangeValue: (value: string) => monaco.editor.IMarkerData[];
	// onValueError?(err: monaco.editor.IMarkerData[]): void;
};

export default function Editor({ initialValue, onChangeValue }: EditorProps) {
	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
			}}
			ref={monacoEl => {
				if (!monacoEl) {
					return;
				}

				const editor = monaco.editor.create(monacoEl, {
					value: initialValue,
					language: "dot",
					lineNumbers: "on",
					selectOnLineNumbers: true,
					wordWrap: "on",
					roundedSelection: false,
					scrollBeyondLastLine: false,
					minimap: { enabled: false },
					automaticLayout: true,
					folding: true,
					glyphMargin: true,
					lightbulb: { enabled: monaco.editor.ShowLightbulbIconMode.On },
				});

				registerCommands(editor);

				const model = editor.getModel();
				if (model === null) {
					import.meta.env.DEV && console.log("Model is null");
					return () => editor?.dispose();
				}

				model.onDidChangeContent(() => {
					const newMarkers = onChangeValue?.(model.getValue());
					if (!newMarkers) {
						return;
					}
					monaco.editor.setModelMarkers(model, "dot", newMarkers);
				});

				return () => {
					model.dispose();
					editor?.dispose();
				};
			}}
		></div>
	);
}
