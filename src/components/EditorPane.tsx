import { loader, default as MonacoEditor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Component } from "react";

import { saveLastSource } from "../config.js";
import * as ls from "../dot-monaco/index.js";

type Monaco = typeof monaco;

loader.config({ monaco });

type EditorPaneProps = {
	defaultValue?: string;
	onChangeValue(value: string): void;
	onValueError(err: monaco.editor.IMarkerData[]): void;
};

const SOURCE_SAVE_TIMEOUT = 5 * 1000; // 5 seconds

export default class EditorPane extends Component<EditorPaneProps, object> {
	#processor: ls.LanguageProcessor | undefined;
	#editor: monaco.editor.IStandaloneCodeEditor | undefined;
	#autoSaveTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	state: object = {};

	loadValue(value: string) {
		const e = this.#editor;
		if (e) {
			e.setValue(value);
		}
	}

	#editorWillMount = (monaco: Monaco): void => {
		ls.registerService(monaco, ls.service);
		this.#processor = ls.service.processor;
	};

	#onChange = (
		value: string | undefined,
		_event: monaco.editor.IModelContentChangedEvent,
	): void => {
		const p = this.#processor;
		const e = this.#editor;
		if (!p || !e) return;

		if (typeof this.#autoSaveTimeout !== "undefined") {
			clearTimeout(this.#autoSaveTimeout);
		}
		this.#autoSaveTimeout = setTimeout(
			() => saveLastSource(value),
			SOURCE_SAVE_TIMEOUT,
		);
	};

	render() {
		const defaultValue = this.props.defaultValue || "";
		return (
			<MonacoEditor
				defaultValue={defaultValue}
				onChange={this.#onChange}
				beforeMount={this.#editorWillMount}
			/>
		);
	}
}
