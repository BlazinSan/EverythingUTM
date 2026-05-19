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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeReplyEmail(value) {
  const email = String(value || "").trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ? email
    : "unknown@everythingutm.app";
}

async function sendWithFormSubmit({ toEmail, body, submittedAt, details }) {
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

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, reason: "Method not allowed" });
  }

  const body = JSON.parse(event.body || "{}");
  const submittedAt = body.dateTime || new Date().toISOString();
  const details = String(body.details || "").trim();
  if (!details) {
    return json(400, { ok: false, reason: "Missing bug details" });
  }

  const fromEmail =
    process.env.BUG_REPORT_FROM || "EverythingUTM <onboarding@resend.dev>";
  const toEmail = process.env.BUG_REPORT_TO || "hammau05@gmail.com";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    const fallback = await sendWithFormSubmit({
      toEmail,
      body,
      submittedAt,
      details,
    });
    if (fallback.ok) {
      return json(200, { ok: true, provider: "formsubmit" });
    }
    return json(500, {
      ok: false,
      reason: `Missing RESEND_API_KEY on Netlify and fallback email failed: ${fallback.text}`,
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
  if (!response.ok) {
    const fallback = await sendWithFormSubmit({
      toEmail,
      body,
      submittedAt,
      details,
    });
    if (fallback.ok) {
      return json(200, { ok: true, provider: "formsubmit" });
    }
    return json(502, {
      ok: false,
      reason: `Email provider rejected the message: ${responseText}. Fallback failed: ${fallback.text}`,
    });
  }

  return json(200, { ok: true });
}
