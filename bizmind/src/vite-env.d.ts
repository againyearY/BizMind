/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_API_CONFIG: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
