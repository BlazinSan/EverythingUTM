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
      .take(200);
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("profiles")
      .withIndex("by_usernameNormalized", (q) =>
        q.eq("usernameNormalized", normalizeUsername(args.username)),
      )
      .unique();
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !args.query.trim()) {
      return [];
    }
    return await ctx.db
      .query("profiles")
      .withSearchIndex("search_username", (q) =>
        q.search("username", args.query).eq("saved", true),
      )
      .take(8);
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
    if (!/^[a-z0-9_]{3,24}$/.test(usernameNormalized)) {
      throw new Error("Username must be 3-24 letters, numbers, or underscores.");
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
    const { userId, clerkUserId } = await requireUser(ctx);
    const ownedUserIds = new Set([userId, clerkUserId]);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    const ownedKeys = [
      "everything-utm:marketplace",
      "everything-utm:messages",
      "everything-utm:questions",
      "everything-utm:requests",
      "everything-utm:profile-reviews",
    ];

    for (const storageKey of ownedKeys) {
      const row = await ctx.db
        .query("appState")
        .withIndex("by_storageKey", (q) => q.eq("storageKey", storageKey))
        .unique();
      if (!row || !Array.isArray(row.data)) {
        continue;
      }
      const data = row.data;
      const nextData = data
        .filter((item) => {
          if (!item || typeof item !== "object") {
            return true;
          }
          const entry = item as Record<string, unknown>;
          return ![
            entry.authorId,
            entry.sellerId,
            entry.requesterId,
            entry.reviewerId,
          ].some((value) => typeof value === "string" && ownedUserIds.has(value));
        })
        .map((item) => {
          if (!item || typeof item !== "object") {
            return item;
          }
          const entry = item as Record<string, unknown>;
          if (
            typeof entry.driverId === "string" &&
            ownedUserIds.has(entry.driverId)
          ) {
            const { driver, driverId, driverAvatar, ...rest } = entry;
            return {
              ...rest,
              status: entry.status === "Matched" ? "Open" : entry.status,
            };
          }
          if (Array.isArray(entry.answers)) {
            return {
              ...entry,
              answers: entry.answers.filter((answer) => {
                return (
                  !answer ||
                  typeof answer !== "object" ||
                  !ownedUserIds.has(
                    String((answer as Record<string, unknown>).authorId ?? ""),
                  )
                );
              }),
            };
          }
          return item;
        });

      await ctx.db.patch(row._id, {
        data: nextData,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }

    return true;
  },
});
