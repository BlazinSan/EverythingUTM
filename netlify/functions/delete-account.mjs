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

const rateBuckets = globalThis.__everythingutmDeleteAccountRateBuckets ?? new Map();
globalThis.__everythingutmDeleteAccountRateBuckets = rateBuckets;

function rateLimited(id, maxHits = 2, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const hits = (rateBuckets.get(id) || []).filter((time) => now - time < windowMs);
  if (hits.length >= maxHits) {
    const waitMs = windowMs - (now - Math.min(...hits));
    rateBuckets.set(id, hits);
    return { limited: true, waitMs };
  }
  rateBuckets.set(id, [...hits, now]);
  return { limited: false, waitMs: 0 };
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
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!accessToken) {
    return json(401, { ok: false, reason: "Missing signed-in session" });
  }
  const rate = rateLimited(accessToken.slice(-32) || "unknown");
  if (rate.limited) {
    return json(429, {
      ok: false,
      reason: `Too many account deletion attempts. Try again in ${Math.ceil(rate.waitMs / 60000)} minute(s).`,
    });
  }
  if (!anonKey) {
    return json(500, {
      ok: false,
      reason: "Online account deletion is not configured. Missing SUPABASE_ANON_KEY on Netlify.",
    });
  }

  if (!serviceRoleKey) {
    const rpcResponse = await supabaseFetch(
      "/rest/v1/rpc/delete_everythingutm_current_user",
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );
    const rpcText = await rpcResponse.text().catch(() => "");
    if (rpcResponse.ok) {
      return json(200, { ok: true });
    }
    return json(500, {
      ok: false,
      reason:
        rpcText ||
        "Online account deletion RPC is not installed yet. Apply the Supabase migration or add SUPABASE_SERVICE_ROLE_KEY to Netlify.",
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
