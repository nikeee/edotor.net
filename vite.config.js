import * as path from "node:path";

import { defineConfig, loadEnv } from "vite"
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { viteStaticCopy } from "vite-plugin-static-copy"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());
	return {
		resolve: {
			alias: {
				"vscode": path.resolve(__dirname, "./node_modules/monaco-languageclient/lib/vscode-compatibility"),
			}
		},
		plugins: [
			viteStaticCopy({
				targets: [
					{
						src: "CNAME",
						dest: "",
					}
				]
			}),
			ViteEjsPlugin({
				includeMatomo: !!env.VITE_MATOMO_API_BASE,
				matomoApiBase: env.VITE_MATOMO_API_BASE,
				version: env.VITE_VERSION,
			}, {
				ejs: {
					beautify: false,
				},
			}),
			react({
				babel: {
					plugins: [
						["babel-plugin-react-compiler"],
					],
				},
			}),
		],
	}
});
