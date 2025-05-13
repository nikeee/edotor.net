/// <reference types="vite/client" />

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
	readonly VITE_VERSION: string;
	readonly VITE_MATOMO_API_BASE: string;
}
