import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in.");
  }
  return identity.tokenIdentifier;
}

function sanitizeReview(review: unknown) {
  const copy =
    review && typeof review === "object"
      ? { ...(review as Record<string, unknown>) }
      : {};
  copy.body = String(copy.body ?? "").trim().slice(0, 800);
  copy.profileName = String(copy.profileName ?? "").trim().slice(0, 120);
  copy.reviewer = String(copy.reviewer ?? "").trim().slice(0, 120);
  copy.reviewerAvatar =
    typeof copy.reviewerAvatar === "string" && !copy.reviewerAvatar.startsWith("data:")
      ? copy.reviewerAvatar
      : "";
  const rating = Number(copy.rating);
  copy.rating = Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5;
  if (!copy.profileName || !copy.reviewer || !copy.body) {
    throw new Error("Review needs a profile, reviewer, and comment.");
  }
  const serialized = JSON.stringify(copy);
  if (serialized.length > 6_000 || serialized.includes("data:")) {
    throw new Error("Review payload is too large.");
  }
  return copy;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const rows = await ctx.db.query("profileReviews").order("desc").take(100);
    return rows.map((row) => row.review);
  },
});

export const add = mutation({
  args: {
    reviewId: v.string(),
    review: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const review: Record<string, unknown> = {
      ...sanitizeReview(args.review),
      id: args.reviewId,
    };

    const existing = await ctx.db
      .query("profileReviews")
      .withIndex("by_reviewId", (q) => q.eq("reviewId", args.reviewId))
      .unique();
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("profileReviews", {
      reviewId: args.reviewId,
      review,
      profileName: String(review.profileName),
      reviewerId: userId,
      createdAt: Date.now(),
    });
  },
});
