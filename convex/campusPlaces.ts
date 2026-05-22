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

const locationValidator = v.object({
  id: v.string(),
  name: v.string(),
  category: v.string(),
  lat: v.number(),
  lng: v.number(),
  area: v.string(),
  blurb: v.string(),
  bestFor: v.array(v.string()),
});

function cleanLocation(location: {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  area: string;
  blurb: string;
  bestFor: string[];
}) {
  const clean = {
    id: location.id.trim().slice(0, 80),
    name: location.name.trim().slice(0, 120),
    category: location.category.trim().slice(0, 50) || "Services",
    lat: Number(location.lat),
    lng: Number(location.lng),
    area: location.area.trim().slice(0, 120),
    blurb: location.blurb.trim().slice(0, 320),
    bestFor: location.bestFor
      .map((item) => item.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 8),
  };
  if (!clean.id || !clean.name || !Number.isFinite(clean.lat) || !Number.isFinite(clean.lng)) {
    throw new Error("Location needs a name and valid coordinates.");
  }
  if (clean.lat < -90 || clean.lat > 90 || clean.lng < -180 || clean.lng > 180) {
    throw new Error("Location coordinates are outside valid map bounds.");
  }
  if (!clean.blurb) {
    clean.blurb = "Added by EverythingUTM admin.";
  }
  return clean;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const rows = await ctx.db.query("campusLocations").order("desc").take(100);
    return rows.map((row) => row.location);
  },
});

export const upsert = mutation({
  args: {
    locationId: v.string(),
    location: locationValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const location = cleanLocation({ ...args.location, id: args.locationId });
    const existing = await ctx.db
      .query("campusLocations")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        location,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("campusLocations", {
      locationId: args.locationId,
      location,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    });
  },
});
