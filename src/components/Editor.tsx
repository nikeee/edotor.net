import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { useState } from "react";

import "./importWorker";

export default function Editor() {
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
						value: [
							"function x() {",
							'\tconsole.log("Hello world!");',
							"}",
						].join("\n"),
						language: "dot", //"typescript",
					});
				});

				return () => editor?.dispose();
			}}
		></div>
	);
}
