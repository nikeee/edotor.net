import { defineConfig } from 'vite'
import { ViteEjsPlugin } from "vite-plugin-ejs";
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [
		ViteEjsPlugin({
			includeMatomo: false,
			matomoApiBase: '',
		}),
		react(),
	],
})
