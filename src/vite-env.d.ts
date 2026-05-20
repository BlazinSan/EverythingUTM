/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_CONVEX_URL?: string;
  readonly VITE_BUY_ME_COFFEE_URL?: string;
  readonly VITE_OWNER_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
