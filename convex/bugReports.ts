import { action, mutation } from "./_generated/server";
import { v } from "convex/values";

function formatMalaysiaDateTime(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
    .formatToParts(new Date(timestamp))
    .reduce<Record<string, string>>((current, part) => {
      current[part.type] = part.value;
      return current;
    }, {});

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second} ${(parts.dayPeriod ?? "").toUpperCase()} MYT`;
}

export const create = mutation({
  args: {
    userName: v.string(),
    userEmail: v.string(),
    details: v.string(),
    emailed: v.boolean(),
    emailError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const reportedAt = Date.now();
    return await ctx.db.insert("bugReports", {
      userId: identity?.tokenIdentifier,
      userName: args.userName,
      userEmail: args.userEmail,
      details: args.details,
      reportedAt,
      reportedAtLocal: formatMalaysiaDateTime(reportedAt),
      emailed: args.emailed,
      emailError: args.emailError,
    });
  },
});

export const sendEmail = action({
  args: {
    userName: v.string(),
    userEmail: v.string(),
    details: v.string(),
  },
  handler: async (_ctx, args) => {
    const details = args.details.trim();
    if (!details) {
      throw new Error("Bug report needs details.");
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.BUG_REPORT_TO || "hammau05@gmail.com";
    const fromEmail =
      process.env.BUG_REPORT_FROM || "EverythingUTM <onboarding@resend.dev>";
    const reportedAtLocal = formatMalaysiaDateTime(Date.now());
    const text = [
      "EverythingUTM Bug Report",
      "",
      `User: ${args.userName || "Unknown"}`,
      `Email: ${args.userEmail || "Unknown"}`,
      `Date/time: ${reportedAtLocal}`,
      "",
      details,
    ].join("\n");

    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured in Convex, so the bug report was saved but no email was sent.",
      );
    }

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
        reply_to:
          args.userEmail && args.userEmail.includes("@")
            ? args.userEmail
            : undefined,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text().catch(() => "Email failed"));
    }

    return { ok: true, provider: "resend", reportedAtLocal };
  },
});

export const sendListingReportEmail = action({
  args: {
    listingUrl: v.string(),
    listingTitle: v.string(),
    listingContent: v.string(),
    listingCategory: v.string(),
    listingPrice: v.string(),
    sellerName: v.string(),
    sellerUsername: v.string(),
    reporterName: v.string(),
    reporterUsername: v.string(),
    postedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to report a listing.");
    }
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.BUG_REPORT_TO || "hammau05@gmail.com";
    const fromEmail =
      process.env.BUG_REPORT_FROM || "EverythingUTM <onboarding@resend.dev>";
    const reportedAtLocal = formatMalaysiaDateTime(Date.now());

    const text = [
      "EverythingUTM Marketplace Listing Report",
      "",
      `Reported at: ${reportedAtLocal}`,
      `Reported by: ${args.reporterName || "Unknown"} (${args.reporterUsername || "username not shared"})`,
      "",
      "Listing",
      `Title: ${args.listingTitle}`,
      `Link: ${args.listingUrl}`,
      `Category: ${args.listingCategory}`,
      `Price: ${args.listingPrice}`,
      `Posted at: ${args.postedAt}`,
      `Seller: ${args.sellerName || "Unknown"} (${args.sellerUsername || "username not shared"})`,
      "",
      "Content",
      args.listingContent,
    ].join("\n");

    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured in Convex, so the listing report could not be emailed.",
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: `EverythingUTM listing report: ${args.listingTitle}`,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text().catch(() => "Email failed"));
    }

    return { ok: true, provider: "resend", reportedAtLocal };
  },
});
