const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function supabaseFetch(path, options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
  }
  const url = `${supabaseUrl.replace(/\/$/, "")}${path}`;
  return fetch(url, options);
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, reason: "Method not allowed" });
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!accessToken) {
    return json(401, { ok: false, reason: "Missing signed-in session" });
  }
  if (!serviceRoleKey || !anonKey) {
    return json(500, {
      ok: false,
      reason: "Missing Supabase service role credentials on Netlify",
    });
  }

  const userResponse = await supabaseFetch("/auth/v1/user", {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const userPayload = await userResponse.json().catch(() => ({}));
  if (!userResponse.ok || !userPayload?.id) {
    return json(401, { ok: false, reason: "Invalid session" });
  }

  const namespace =
    process.env.SUPABASE_NAMESPACE ||
    process.env.VITE_SUPABASE_NAMESPACE ||
    "everythingutm-production";
  const serviceHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  await supabaseFetch(`/rest/v1/user_profiles?id=eq.${encodeURIComponent(userPayload.id)}`, {
    method: "DELETE",
    headers: serviceHeaders,
  }).catch(() => undefined);
  await supabaseFetch(
    `/rest/v1/app_state?namespace=eq.${encodeURIComponent(namespace)}&storage_key=eq.${encodeURIComponent(`everything-utm:user-profile:${userPayload.id}`)}`,
    {
      method: "DELETE",
      headers: serviceHeaders,
    },
  ).catch(() => undefined);

  const deleteResponse = await supabaseFetch(
    `/auth/v1/admin/users/${encodeURIComponent(userPayload.id)}`,
    {
      method: "DELETE",
      headers: serviceHeaders,
    },
  );
  const deleteText = await deleteResponse.text().catch(() => "");
  if (!deleteResponse.ok) {
    return json(502, {
      ok: false,
      reason: deleteText || "Supabase refused to delete the user",
    });
  }

  return json(200, { ok: true });
}
