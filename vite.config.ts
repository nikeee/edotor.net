import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig, loadEnv } from "vite";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());
	return {
		plugins: [
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
		],
	};
});
