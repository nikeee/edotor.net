import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig, loadEnv, lazyPlugins } from "vite-plus";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());
	return {
		staged: {
			"*.{js,ts,tsx,jsx,css,scss}": "vp fmt",
		},
		fmt: {
			ignorePatterns: ["*.md", "index.html"],
			arrowParens: "avoid",
		},
		lint: {
			plugins: ["typescript", "react"],
			jsPlugins: [
				{
					name: "react-hooks-js",
					specifier: "eslint-plugin-react-hooks",
				},
				{
					name: "vite-plus",
					specifier: "vite-plus/oxlint-plugin",
				},
			],
			options: {
				typeAware: true,
				typeCheck: true,
			},
			rules: {
				"vite-plus/prefer-vite-plus-imports": "error",
			},
		},
		plugins: lazyPlugins(() => [
			viteStaticCopy({
				targets: [
					{
						src: "CNAME",
						dest: "",
					},
				],
			}),
			ViteEjsPlugin(
				{
					includeMatomo: !!env.VITE_MATOMO_API_BASE,
					matomoApiBase: env.VITE_MATOMO_API_BASE,
					version: env.VITE_VERSION,
				},
				{
					ejs: {
						beautify: false,
					},
				},
			),
			react(),
			babel({
				presets: [reactCompilerPreset()],
			} as any),
		]),
	};
});
