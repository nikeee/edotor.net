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

		const model = e.getModel();
		let markers: monaco.editor.IMarkerData[] | undefined;
		try {
			markers = p.processAndValidate(model as monaco.editor.IReadOnlyModel);
		} catch {
			markers = undefined;
		}

		monaco.editor.setModelMarkers(
			model as monaco.editor.ITextModel,
			"dot",
			markers || [],
		);

		const props = this.props;
		if (markers && markers.length > 0) {
			if (props.onValueError) {
				props.onValueError(markers);
			}
		} else {
			if (props.onChangeValue && typeof value !== "undefined") {
				props.onChangeValue(value);
			}
		}

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
