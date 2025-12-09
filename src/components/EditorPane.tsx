import { default as MonacoEditor } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { Component } from "react";

type EditorPaneProps = {
	defaultValue?: string;
	onChangeValue(value: string): void;
	onValueError(err: monaco.editor.IMarkerData[]): void;
};

export default class EditorPane extends Component<EditorPaneProps, object> {
	#editor: monaco.editor.IStandaloneCodeEditor | undefined;

	state: object = {};

	loadValue(value: string) {
		const e = this.#editor;
		if (e) {
			e.setValue(value);
		}
	}

	render() {
		const defaultValue = this.props.defaultValue || "";
		return <MonacoEditor defaultValue={defaultValue} />;
	}
}
