import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const preferenceKeyPrefix = "everything-utm:preferences:";
const maxPreferencePayloadBytes = 4096;
const legacyHeavyStorageKeys = [
  "everything-utm:marketplace",
  "everything-utm:messages",
  "everything-utm:questions",
  "everything-utm:requests",
  "everything-utm:profile-reviews",
  "everything-utm:papers",
  "everything-utm:bus-documents",
  "everything-utm:banned-users",
  "everything-utm:typing-signals",
];

async function currentUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.tokenIdentifier ?? null;
}

function isPreferencesKey(storageKey: string) {
  return storageKey.startsWith(preferenceKeyPrefix);
}

function validatePreferencesPayload(storageKey: string, data: unknown) {
  if (!isPreferencesKey(storageKey)) {
    throw new Error("Only lightweight preference appState keys are allowed.");
  }
  const serialized = JSON.stringify(data);
  if (serialized.length > maxPreferencePayloadBytes) {
    throw new Error("Preference appState payload is too large.");
  }
  if (serialized.includes("data:")) {
    throw new Error("Files and base64 data must not be stored in appState.");
  }
}

export const get = query({
  args: { storageKey: v.string() },
  handler: async (ctx, args) => {
    if (!isPreferencesKey(args.storageKey)) {
      return null;
    }
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
    validatePreferencesPayload(args.storageKey, args.data);

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
      if (JSON.stringify(existing.data) === JSON.stringify(args.data)) {
        return existing._id;
      }
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("appState", {
      storageKey: args.storageKey,
      ...patch,
    });
  },
});

export const deleteLegacyHeavyState = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    if (!userId) {
      throw new Error("You must be signed in.");
    }
    let deleted = 0;
    for (const storageKey of legacyHeavyStorageKeys) {
      const row = await ctx.db
        .query("appState")
        .withIndex("by_storageKey", (q) => q.eq("storageKey", storageKey))
        .unique();
      if (!row) {
        continue;
      }
      await ctx.db.delete(row._id);
      deleted += 1;
    }
    return { deleted };
  },
});
