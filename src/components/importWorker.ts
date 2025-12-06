import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
// import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
// import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
// import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

import { service } from "../dot-monaco/client.js";

const langs = monaco.languages;
langs.register(service.language);
langs.setMonarchTokensProvider("dot", service.monarchTokens);
langs.setLanguageConfiguration("dot", service.languageConfig);
langs.registerCompletionItemProvider("dot", service.completionItemProvider);
langs.registerHoverProvider("dot", service.hoverProvider);
langs.registerDefinitionProvider("dot", service.definitionProvider);
langs.registerReferenceProvider("dot", service.referenceProvider);
langs.registerRenameProvider("dot", service.renameProvider);
langs.registerCodeActionProvider("dot", service.codeActionProvider);
langs.registerColorProvider("dot", service.colorProvider);

self.MonacoEnvironment = {
	getWorker(_: unknown, label: string) {
		switch (label) {
			// case "json":
			// 	return new jsonWorker();
			// case "css":
			// case "scss":
			// case "less":
			// 	return new cssWorker();
			// case "html":
			// 	return new htmlWorker();
			// case "typescript":
			// case "javascript":
			// 	return new tsWorker();
			default:
				return new editorWorker();
		}
	},
};
