import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

import "./importWorker";

export type EditorProps = {
	initialValue?: string | undefined;
	onChangeValue?(value: string): void;
	onValueError?(err: monaco.editor.IMarkerData[]): void;
};

export default function Editor({ initialValue }: EditorProps) {
	const [editor, setEditor] =
		useState<monaco.editor.IStandaloneCodeEditor | null>(null);

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

				const model = editor.getModel();
				if (model === null) {
					import.meta.env.DEV && console.log("Model is null");
					return () => editor?.dispose();
				}

				return () => {
					model.dispose();
					editor?.dispose();
				};
			}}
		></div>
	);
}
