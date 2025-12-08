import { languages } from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

import { service } from "../dot-monaco/index.js";

languages.register(service.language);
languages.setMonarchTokensProvider("dot", service.monarchTokens);
languages.setLanguageConfiguration("dot", service.languageConfig);
languages.registerCompletionItemProvider("dot", service.completionItemProvider);
languages.registerHoverProvider("dot", service.hoverProvider);
languages.registerDefinitionProvider("dot", service.definitionProvider);
languages.registerReferenceProvider("dot", service.referenceProvider);
languages.registerRenameProvider("dot", service.renameProvider);
languages.registerCodeActionProvider("dot", service.codeActionProvider);
languages.registerColorProvider("dot", service.colorProvider);

self.MonacoEnvironment = {
	getWorker(_: unknown, _label: string) {
		return new editorWorker();
	},
};
