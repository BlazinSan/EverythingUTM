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

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function safeRemoteUrl(value: unknown) {
  return typeof value === "string" && !value.startsWith("data:")
    ? value.slice(0, 2000)
    : "";
}

function cleanRequest(value: unknown, userId: string) {
  const request = asRecord(value);
  request.id = String(request.id ?? "").trim();
  request.type = request.type === "Delivery" ? "Delivery" : "Ride";
  request.title = String(request.title ?? "").trim().slice(0, 120);
  request.requester = String(request.requester ?? "").trim().slice(0, 120);
  request.requesterId = String(request.requesterId ?? userId);
  request.requesterAvatar = safeRemoteUrl(request.requesterAvatar);
  request.driver = String(request.driver ?? "").trim().slice(0, 120) || undefined;
  request.driverId = String(request.driverId ?? "").trim().slice(0, 160) || undefined;
  request.driverAvatar = safeRemoteUrl(request.driverAvatar) || undefined;
  request.driverTokenIdentifier =
    String(request.driverTokenIdentifier ?? "").trim().slice(0, 180) || undefined;
  request.pickup = String(request.pickup ?? "").trim().slice(0, 140);
  request.dropoff = String(request.dropoff ?? "").trim().slice(0, 140);
  request.notes = String(request.notes ?? "").trim().slice(0, 1200);
  request.status = String(request.status ?? "Open").slice(0, 40);
  if (!request.id || !request.title || !request.requester) {
    throw new Error("Request needs an id, title, and requester.");
  }
  const serialized = JSON.stringify(request);
  if (serialized.length > 40_000 || serialized.includes("data:")) {
    throw new Error("Request payload is too large.");
  }
  return JSON.parse(serialized) as Record<string, unknown>;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const rows = await ctx.db.query("serviceRequests").order("desc").take(80);
    return rows.filter((row) => !row.deletedAt).map((row) => row.request);
  },
});

export const upsert = mutation({
  args: {
    requestId: v.string(),
    request: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const request = cleanRequest(args.request, userId);
    const existing = await ctx.db
      .query("serviceRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .unique();
    const now = Date.now();
    if (existing) {
      if (existing.createdBy !== userId) {
        throw new Error("Only the request author can update this request.");
      }
      await ctx.db.patch(existing._id, {
        request,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("serviceRequests", {
      requestId: args.requestId,
      request,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    });
  },
});

export const markDeleted = mutation({
  args: {
    requestId: v.string(),
    deletedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("serviceRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .unique();
    if (!existing) {
      return null;
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the request author can delete this request.");
    }
    await ctx.db.patch(existing._id, {
      request: {
        ...asRecord(existing.request),
        deletedAt: args.deletedAt,
        deletedBy: userId,
      },
      deletedAt: args.deletedAt,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const match = mutation({
  args: {
    requestId: v.string(),
    driverName: v.string(),
    driverId: v.string(),
    driverAvatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("serviceRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .unique();
    if (!existing || existing.deletedAt) {
      throw new Error("Transport request was not found.");
    }
    if (existing.createdBy === userId) {
      throw new Error("You cannot match your own request.");
    }
    const request = asRecord(existing.request);
    if (request.status !== "Open") {
      throw new Error("This request is no longer open.");
    }
    const nextRequest = {
      ...request,
      status: "Matched",
      driver: args.driverName.trim().slice(0, 120),
      driverId: args.driverId.trim().slice(0, 160),
      driverAvatar: safeRemoteUrl(args.driverAvatar),
      driverTokenIdentifier: userId,
    };
    await ctx.db.patch(existing._id, {
      request: nextRequest,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const complete = mutation({
  args: {
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("serviceRequests")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .unique();
    if (!existing || existing.deletedAt) {
      throw new Error("Transport request was not found.");
    }
    const request = asRecord(existing.request);
    if (
      existing.createdBy !== userId &&
      request.driverTokenIdentifier !== userId
    ) {
      throw new Error("Only the requester or matched driver can complete this request.");
    }
    await ctx.db.patch(existing._id, {
      request: {
        ...request,
        status: "Completed",
      },
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});
