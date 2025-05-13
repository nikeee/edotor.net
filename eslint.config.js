import parser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import * as reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
	{
		files: ["*/**/*.{js,ts,tsx,jsx}"],
		languageOptions: { parser, sourceType: "module" },
		rules: {
			"react-hooks/react-compiler": "error",
		},
	},
	reactHooks.configs.recommended,
]);
