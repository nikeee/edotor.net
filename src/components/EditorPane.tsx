import * as React from "react";
import MonacoEditor from "react-monaco-editor";
import * as monacoGlobal from "monaco-editor";
import * as ls from "../dot-monaco";
import { saveLastSource } from "../config";

type Props = {
	defaultValue?: string;
	onChangeValue(value: string): void;
	onValueError(err: monacoGlobal.editor.IMarkerData[]): void;
};

const SOURCE_SAVE_TIMEOUT = 5 * 1000; // 5 seconds

export class EditorPane extends React.Component<Props, any> {
	private processor: ls.LanguageProcessor | undefined;
	private editor: monacoGlobal.editor.IStandaloneCodeEditor | undefined;
	private autoSaveTimeout: NodeJS.Timeout | undefined = undefined;

	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	public loadValue(value: string) {
		const e = this.editor;
		if (e) {
			e.setValue(value);
		}
	}

	private editorWillMount = (monaco: typeof monacoGlobal): void => {
		const service = ls.createService();
		ls.registerService(monaco, service);
		this.processor = service.processor;
	}

	private editorDidMount = (editor: monacoGlobal.editor.IStandaloneCodeEditor, monaco: typeof monacoGlobal): void => {
		this.editor = editor;
		ls.registerCommands(editor);

		// the first render() is called before the language is registered
		// We need to refresh the model with the identical value, but a different language
		this.refreshModel(editor, monaco);

		editor.focus();
	}

	private refreshModel(editor: monacoGlobal.editor.IStandaloneCodeEditor, monaco: typeof monacoGlobal) {
		const oldModel = editor.getModel();
		try {
			DEV && console.assert(!!oldModel);

			const newModel = monaco.editor.createModel(
				!!oldModel ? oldModel.getValue() : "",
				"dot",
				monaco.Uri.parse("inmemory://tmp.dot"),
			);

			editor.setModel(newModel);
		} finally {
			if (oldModel)
				oldModel.dispose();
		}
	}

	private onChange = (value: string, event: monacoGlobal.editor.IModelContentChangedEvent): void => {
		const p = this.processor;
		const e = this.editor;
		if (!p || !e) return;

		const model = e.getModel();
		let markers: monacoGlobal.editor.IMarkerData[] | undefined;
		try {
			markers = p.processAndValidate(model as monacoGlobal.editor.IReadOnlyModel);
		} catch (err) {
			markers = undefined;
		}

		monacoGlobal.editor.setModelMarkers(model as monacoGlobal.editor.ITextModel, "dot", markers || []);

		const props = this.props;
		if (markers && markers.length > 0) {
			if (props.onValueError) {
				props.onValueError(markers);
			}
		} else {
			if (props.onChangeValue) {
				props.onChangeValue(value);
			}
		}

		if (typeof this.autoSaveTimeout !== "undefined") {
			clearTimeout(this.autoSaveTimeout);
		}
		this.autoSaveTimeout = setTimeout(() => saveLastSource(value), SOURCE_SAVE_TIMEOUT);
	}

	public render() {
		const defaultValue = this.props.defaultValue || "";
		return (
			<MonacoEditor
				ref="editor"
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
					theme: "vs",
					glyphMargin: true,
					lightbulb: { enabled: true },
				}}
				onChange={this.onChange}
				editorDidMount={this.editorDidMount}
				editorWillMount={this.editorWillMount}
			/>
		);
	}
}

