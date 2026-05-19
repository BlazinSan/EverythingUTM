import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeReplyEmail(value: unknown) {
  const email = String(value || "").trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ? email
    : "unknown@everythingutm.app";
}

async function sendWithFormSubmit({
  toEmail,
  body,
  submittedAt,
  details,
}: {
  toEmail: string;
  body: Record<string, unknown>;
  submittedAt: string;
  details: string;
}) {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: body.userName || "Unknown",
      email: safeReplyEmail(body.userEmail),
      _subject: "EverythingUTM bug report",
      _template: "table",
      _captcha: "false",
      message: `EverythingUTM Bug Report\n\nUser: ${body.userName || "Unknown"}\nEmail: ${body.userEmail || "Unknown"}\nDate/time: ${submittedAt}\n\n${details}`,
    }),
  });
  const text = await response.text().catch(() => "");
  return { ok: response.ok, text };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("BUG_REPORT_FROM") || "EverythingUTM <onboarding@resend.dev>";
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
    const fallback = await sendWithFormSubmit({
      toEmail,
      body,
      submittedAt,
      details,
    });
    if (adminClient) {
      await adminClient.from("bug_reports").insert({
        user_name: body.userName || "Unknown",
        user_email: body.userEmail || "Unknown",
        details,
        reported_at: submittedAt,
        emailed: fallback.ok,
        email_error: fallback.ok ? null : `Missing RESEND_API_KEY. Fallback failed: ${fallback.text}`,
      });
    }
    return new Response(JSON.stringify({
      ok: fallback.ok,
      provider: fallback.ok ? "formsubmit" : undefined,
      reason: fallback.ok
        ? undefined
        : `Missing RESEND_API_KEY. Fallback failed: ${fallback.text}`,
    }), {
      status: fallback.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
  const fallback = response.ok
    ? { ok: false, text: "" }
    : await sendWithFormSubmit({
      toEmail,
      body,
      submittedAt,
      details,
    });
  const delivered = response.ok || fallback.ok;

  if (adminClient) {
    await adminClient.from("bug_reports").insert({
      user_name: body.userName || "Unknown",
      user_email: body.userEmail || "Unknown",
      details,
      reported_at: submittedAt,
      emailed: delivered,
      email_error: delivered ? null : `${responseText}. Fallback failed: ${fallback.text}`,
    });
  }

  return new Response(
    JSON.stringify({
      ok: delivered,
      provider: response.ok ? "resend" : fallback.ok ? "formsubmit" : undefined,
      reason: delivered
        ? undefined
        : `Email provider rejected the message: ${responseText}. Fallback failed: ${fallback.text}`,
    }),
    {
      status: delivered ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
