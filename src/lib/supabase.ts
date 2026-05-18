import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseNamespace =
  import.meta.env.VITE_SUPABASE_NAMESPACE || "everythingutm-production";

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const isSupabaseConfigured = hasSupabaseConfig;

type AppStateRow<T> = {
  data: T;
};

export async function loadSupabaseState<T>(storageKey: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("app_state")
    .select("data")
    .eq("namespace", supabaseNamespace)
    .eq("storage_key", storageKey)
    .maybeSingle<AppStateRow<T>>();

  if (error) {
    throw error;
  }

  return data?.data ?? null;
}

export async function saveSupabaseState<T>(storageKey: string, value: T) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("app_state").upsert({
    namespace: supabaseNamespace,
    storage_key: storageKey,
    data: value,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}
