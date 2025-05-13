import * as path from 'node:path';

import { defineConfig } from 'vite'
import { ViteEjsPlugin } from "vite-plugin-ejs";
import react from '@vitejs/plugin-react'

export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(__dirname, './node_modules'),
		}
	},
	plugins: [
		ViteEjsPlugin({
			// TODO: Add CI logic
			includeMatomo: false,
			matomoApiBase: '',
		}),
		react(),
	],
})
