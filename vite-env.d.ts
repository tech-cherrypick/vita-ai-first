/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_KEY: string
    readonly VITE_CLOUD_FUNCTION_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
