/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  // agrega aquí otros VITE_... que tengas
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
