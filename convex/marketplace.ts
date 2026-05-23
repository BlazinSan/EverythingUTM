import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in.");
  }
  return identity.tokenIdentifier;
}

async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const ownerEmail = String(process.env.OWNER_EMAIL || "hammau05@gmail.com").toLowerCase();
  if (!identity?.email || identity.email.toLowerCase() !== ownerEmail) {
    throw new Error("Owner access is required.");
  }
  return identity.tokenIdentifier;
}

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function sanitizeListingForStorage(value: unknown, userId: string) {
  const listing = asRecord(value);
  listing.id = String(listing.id ?? "").trim();
  listing.title = String(listing.title ?? "").trim().slice(0, 90);
  listing.category = String(listing.category ?? "Books").trim().slice(0, 40);
  listing.seller = String(listing.seller ?? "").trim().slice(0, 120);
  listing.sellerId = String(listing.sellerId ?? userId);
  listing.sellerAvatar =
    typeof listing.sellerAvatar === "string" && !listing.sellerAvatar.startsWith("data:")
      ? listing.sellerAvatar
      : "";
  listing.location = String(listing.location ?? "UTM Johor Bahru").trim().slice(0, 120);
  listing.description = String(listing.description ?? "").trim().slice(0, 1200);
  listing.image =
    typeof listing.image === "string" && !listing.image.startsWith("data:")
      ? listing.image
      : "";
  listing.images = Array.isArray(listing.images)
    ? listing.images
        .filter((image) => typeof image === "string" && !image.startsWith("data:"))
        .slice(0, 6)
    : [];
  listing.imageFileIds = Array.isArray(listing.imageFileIds)
    ? listing.imageFileIds
        .filter((id) => typeof id === "string" && id)
        .slice(0, 6)
    : [];
  if (!listing.id || !listing.title || !listing.description || !listing.seller) {
    throw new Error("Listing needs an id, title, seller, and description.");
  }
  const serialized = JSON.stringify(listing);
  if (serialized.length > 80_000 || serialized.includes("data:")) {
    throw new Error("Listing payload is too large. Upload images through file storage first.");
  }
  return JSON.parse(serialized) as Record<string, unknown>;
}

async function withListingMedia(ctx: QueryCtx, listing: unknown) {
  const copy = asRecord(listing);
  const fileIds = Array.isArray(copy.imageFileIds)
    ? copy.imageFileIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      )
    : [];
  if (fileIds.length) {
    const urls = await Promise.all(
      fileIds.map((id) => ctx.storage.getUrl(id as Id<"_storage">)),
    );
    const images = urls.filter((url): url is string => Boolean(url));
    copy.images = images;
    copy.image = images[0] ?? "";
  }
  if (typeof copy.sellerAvatar === "string" && copy.sellerAvatar.startsWith("data:")) {
    copy.sellerAvatar = "";
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
    const rows = await ctx.db.query("marketplaceListings").order("desc").take(80);
    return await Promise.all(
      rows.map(async (row) => {
        const listing = asRecord(row.listing);
        if (row.deletedAt && typeof listing.deletedAt !== "string") {
          listing.deletedAt = row.deletedAt;
        }
        return withListingMedia(ctx, listing);
      }),
    );
  },
});

export const upsert = mutation({
  args: {
    listingId: v.string(),
    listing: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const listing = sanitizeListingForStorage(args.listing, userId);
    const existing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .unique();
    const now = Date.now();

    if (existing) {
      if (existing.createdBy !== userId) {
        throw new Error("Only the listing author can update this post.");
      }
      const patch: {
        listing: Record<string, unknown>;
        updatedAt: number;
        deletedAt?: string;
      } = {
        listing,
        updatedAt: now,
      };
      if (typeof listing.deletedAt === "string") {
        patch.deletedAt = listing.deletedAt;
      }
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    const row: {
      listingId: string;
      listing: Record<string, unknown>;
      createdAt: number;
      updatedAt: number;
      createdBy: string;
      deletedAt?: string;
    } = {
      listingId: args.listingId,
      listing,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };
    if (typeof listing.deletedAt === "string") {
      row.deletedAt = listing.deletedAt;
    }
    return await ctx.db.insert("marketplaceListings", row);
  },
});

export const markDeleted = mutation({
  args: {
    listingId: v.string(),
    deletedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .unique();
    if (!existing) {
      return null;
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the listing author can delete this post.");
    }
    await ctx.db.patch(existing._id, {
      listing: {
        ...asRecord(existing.listing),
        deletedAt: args.deletedAt,
        deletedBy: userId,
      },
      deletedAt: args.deletedAt,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const setSold = mutation({
  args: {
    listingId: v.string(),
    sold: v.boolean(),
    soldAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .unique();
    if (!existing) {
      return null;
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the listing author can update this post.");
    }
    const listing: Record<string, unknown> = {
      ...asRecord(existing.listing),
      sold: args.sold,
    };
    if (args.sold && args.soldAt) {
      listing.soldAt = args.soldAt;
    } else {
      delete listing.soldAt;
    }
    await ctx.db.patch(existing._id, {
      listing,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const adminMarkDeleted = mutation({
  args: {
    listingId: v.string(),
    deletedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const existing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .unique();
    if (!existing) {
      return null;
    }
    await ctx.db.patch(existing._id, {
      listing: {
        ...asRecord(existing.listing),
        deletedAt: args.deletedAt,
        deletedBy: ownerId,
      },
      deletedAt: args.deletedAt,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});
