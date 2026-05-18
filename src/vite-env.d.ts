/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_NAMESPACE?: string;
  readonly VITE_BUY_ME_COFFEE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
