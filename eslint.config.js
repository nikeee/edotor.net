import parser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
	{
		files: ["*/**/*.{js,ts,tsx,jsx}"],
		languageOptions: { parser, sourceType: "module" },
		...reactHooks.configs.flat.recommended,
	}, {
		ignores: ["dist/", "node_modules/"],
	},
]);
