import * as path from 'node:path';

import { defineConfig, loadEnv } from 'vite'
import { ViteEjsPlugin } from "vite-plugin-ejs";
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());
	return {
		resolve: {
			alias: {
				"~": path.resolve(__dirname, './node_modules'),
			}
		},
		plugins: [
			ViteEjsPlugin({
				// TODO: Add env vars to CI
				includeMatomo: !!env.VITE_MATOMO_API_BASE,
				matomoApiBase: env.VITE_MATOMO_API_BASE,
			}, {
				ejs: {
					beautify: false,
				},
			}),
			react(),
		],
	}
}
);
