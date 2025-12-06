import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { useState } from "react";

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

				setEditor(editor => {
					if (editor) {
						return editor;
					}

					return monaco.editor.create(monacoEl, {
						value: initialValue,
						language: "dot",
					});
				});

				return () => editor?.dispose();
			}}
		></div>
	);
}
