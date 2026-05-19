import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, reason: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail =
    Deno.env.get("BUG_REPORT_FROM") || "EverythingUTM <onboarding@resend.dev>";
  const toEmail = Deno.env.get("BUG_REPORT_TO") || "hammau05@gmail.com";

  const body = await request.json().catch(() => ({}));
  const submittedAt = body.dateTime || new Date().toISOString();
  const details = String(body.details || "").trim();

  if (!details) {
    return new Response(JSON.stringify({ ok: false, reason: "Missing bug details" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const adminClient =
    supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        })
      : null;

  if (!resendApiKey) {
    if (adminClient) {
      await adminClient.from("bug_reports").insert({
        user_name: body.userName || "Unknown",
        user_email: body.userEmail || "Unknown",
        details,
        reported_at: submittedAt,
        emailed: false,
        email_error: "Missing RESEND_API_KEY",
      });
    }

    return new Response(
      JSON.stringify({
        ok: false,
        reason: "Missing RESEND_API_KEY",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const html = `
    <h2>EverythingUTM Bug Report</h2>
    <p><strong>User:</strong> ${escapeHtml(body.userName || "Unknown")}</p>
    <p><strong>Email:</strong> ${escapeHtml(body.userEmail || "Unknown")}</p>
    <p><strong>Date/time:</strong> ${escapeHtml(submittedAt)}</p>
    <pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(details)}</pre>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject: "EverythingUTM bug report",
      text: `EverythingUTM Bug Report\n\nUser: ${body.userName || "Unknown"}\nEmail: ${body.userEmail || "Unknown"}\nDate/time: ${submittedAt}\n\n${details}`,
      html,
    }),
  });

  const responseText = await response.text().catch(() => "");

  if (adminClient) {
    await adminClient.from("bug_reports").insert({
      user_name: body.userName || "Unknown",
      user_email: body.userEmail || "Unknown",
      details,
      reported_at: submittedAt,
      emailed: response.ok,
      email_error: response.ok ? null : responseText,
    });
  }

  return new Response(
    JSON.stringify({
      ok: response.ok,
      provider: response.ok ? "resend" : undefined,
      reason: response.ok ? undefined : responseText,
    }),
    {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});