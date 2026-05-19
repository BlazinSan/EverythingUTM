import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey) {
    return new Response(
      JSON.stringify({ ok: false, reason: "Supabase deletion config is missing" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ ok: false, reason: "Invalid session" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!serviceRoleKey) {
    const { error: rpcError } = await userClient.rpc(
      "delete_everythingutm_current_user",
    );
    return new Response(
      JSON.stringify({
        ok: !rpcError,
        reason: rpcError?.message,
      }),
      {
        status: rpcError ? 500 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const namespace = Deno.env.get("VITE_SUPABASE_NAMESPACE") ||
    Deno.env.get("SUPABASE_NAMESPACE") ||
    "everythingutm-production";

  await admin.from("user_profiles").delete().eq("id", user.id);
  await admin
    .from("app_state")
    .delete()
    .eq("namespace", namespace)
    .eq("storage_key", `everything-utm:user-profile:${user.id}`);

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(
      JSON.stringify({ ok: false, reason: deleteError.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
