import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function currentUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.tokenIdentifier ?? null;
}

export const get = query({
  args: { storageKey: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("appState")
      .withIndex("by_storageKey", (q) => q.eq("storageKey", args.storageKey))
      .unique();
    return row?.data ?? null;
  },
});

export const upsert = mutation({
  args: {
    storageKey: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    if (!userId) {
      throw new Error("You must be signed in.");
    }

    const existing = await ctx.db
      .query("appState")
      .withIndex("by_storageKey", (q) => q.eq("storageKey", args.storageKey))
      .unique();
    const patch = {
      data: args.data,
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("appState", {
      storageKey: args.storageKey,
      ...patch,
    });
  },
});
