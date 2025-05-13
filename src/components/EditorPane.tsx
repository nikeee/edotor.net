import { Component } from "react";
import * as monaco from "monaco-editor";
import { loader, default as MonacoEditor } from "@monaco-editor/react";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

import * as ls from "../dot-monaco/index.js";
import { saveLastSource } from "../config.js";

type Monaco = typeof monaco;

self.MonacoEnvironment = {
	getWorker(_, _label) {
		return new editorWorker();
	},
};
loader.config({ monaco });

type Props = {
	defaultValue?: string;
	onChangeValue(value: string): void;
	onValueError(err: monaco.editor.IMarkerData[]): void;
};

const SOURCE_SAVE_TIMEOUT = 5 * 1000; // 5 seconds

export class EditorPane extends Component<Props, any> {
	private processor: ls.LanguageProcessor | undefined;
	private editor: monaco.editor.IStandaloneCodeEditor | undefined;
	private autoSaveTimeout: ReturnType<typeof setTimeout> | undefined =
		undefined;

	state: any = {};

	public loadValue(value: string) {
		const e = this.editor;
		if (e) {
			e.setValue(value);
		}
	}

	private editorWillMount = (monaco: Monaco): void => {
		const service = ls.createService();
		ls.registerService(monaco, service);
		this.processor = service.processor;
	};

	private editorDidMount = (
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco,
	): void => {
		this.editor = editor;
		ls.registerCommands(editor);

		// the first render() is called before the language is registered
		// We need to refresh the model with the identical value, but a different language
		this.refreshModel(editor, monaco);

		editor.focus();
	};

	private refreshModel(
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco,
	) {
		const oldModel = editor.getModel();
		try {
			import.meta.env.DEV && console.assert(!!oldModel);

			const newModel = monaco.editor.createModel(
				oldModel ? oldModel.getValue() : "",
				"dot",
				monaco.Uri.parse("inmemory://tmp.dot"),
			);

			editor.setModel(newModel);
		} finally {
			if (oldModel) oldModel.dispose();
		}
	}

	private onChange = (
		value: string | undefined,
		event: monaco.editor.IModelContentChangedEvent,
	): void => {
		const p = this.processor;
		const e = this.editor;
		if (!p || !e) return;

		const model = e.getModel();
		let markers: monaco.editor.IMarkerData[] | undefined;
		try {
			markers = p.processAndValidate(model as monaco.editor.IReadOnlyModel);
		} catch (err) {
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

		if (typeof this.autoSaveTimeout !== "undefined") {
			clearTimeout(this.autoSaveTimeout);
		}
		this.autoSaveTimeout = setTimeout(
			() => saveLastSource(value),
			SOURCE_SAVE_TIMEOUT,
		);
	};

	public render() {
		const defaultValue = this.props.defaultValue || "";
		return (
			<MonacoEditor
				language="dot"
				defaultValue={defaultValue}
				options={{
					selectOnLineNumbers: true,
					lineNumbers: "on",
					wordWrap: "on",
					roundedSelection: false,
					scrollBeyondLastLine: false,
					minimap: { enabled: false },
					automaticLayout: true,
					folding: true,
					glyphMargin: true,
					lightbulb: { enabled: true },
				}}
				onChange={this.onChange}
				onMount={this.editorDidMount}
				beforeMount={this.editorWillMount}
			/>
		);
	}
}
