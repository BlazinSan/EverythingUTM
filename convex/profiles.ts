import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in.");
  }
  return {
    userId: identity.tokenIdentifier,
    clerkUserId: identity.subject,
    email: identity.email ?? undefined,
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function withoutLargeProfileMedia(profile: unknown) {
  if (!profile || typeof profile !== "object") {
    return profile;
  }
  return {
    ...(profile as Record<string, unknown>),
    profilePicture: "",
  };
}

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId")
      .order("desc")
      .take(50)
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          profile: withoutLargeProfileMedia(row.profile),
        })),
      );
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const row = await ctx.db
      .query("profiles")
      .withIndex("by_usernameNormalized", (q) =>
        q.eq("usernameNormalized", normalizeUsername(args.username)),
      )
      .unique();
    return row ? { ...row, profile: withoutLargeProfileMedia(row.profile) } : null;
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !args.query.trim()) {
      return [];
    }
    const rows = await ctx.db
      .query("profiles")
      .withSearchIndex("search_username", (q) =>
        q.search("username", args.query).eq("saved", true),
      )
      .take(8);
    return rows.map((row) => ({
      ...row,
      profile: withoutLargeProfileMedia(row.profile),
    }));
  },
});

export const upsertCurrent = mutation({
  args: {
    username: v.string(),
    profile: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, clerkUserId, email } = await requireUser(ctx);
    const username = args.username.trim();
    const usernameNormalized = normalizeUsername(username);
    if (!/^[a-z0-9@~_-]{3,24}$/.test(usernameNormalized)) {
      throw new Error("Username must be 3-24 characters using only letters, numbers, @, ~, -, or _.");
    }

    const existingByUsername = await ctx.db
      .query("profiles")
      .withIndex("by_usernameNormalized", (q) =>
        q.eq("usernameNormalized", usernameNormalized),
      )
      .unique();
    if (existingByUsername && existingByUsername.userId !== userId) {
      throw new Error("That username is already taken.");
    }

    const existingByUser = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const profile = {
      ...args.profile,
      username: usernameNormalized,
      profileSaved: true,
    };
    const row = {
      userId,
      clerkUserId,
      email,
      username: usernameNormalized,
      usernameNormalized,
      name: String(profile.name || ""),
      faculty: String(profile.faculty || ""),
      profile,
      saved: true,
      updatedAt: Date.now(),
    };

    if (existingByUser) {
      await ctx.db.patch(existingByUser._id, row);
      return existingByUser._id;
    }

    return await ctx.db.insert("profiles", row);
  },
});

export const deleteCurrentData = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    const legacySharedKeys = [
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

    for (const storageKey of legacySharedKeys) {
      const row = await ctx.db
        .query("appState")
        .withIndex("by_storageKey", (q) => q.eq("storageKey", storageKey))
        .unique();
      if (!row) {
        continue;
      }
      await ctx.db.delete(row._id);
    }

    return true;
  },
});
