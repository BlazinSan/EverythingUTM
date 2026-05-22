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

async function requireOwner(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const ownerEmail = process.env.OWNER_EMAIL || "hammau05@gmail.com";
  if (!identity || identity.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
    throw new Error("Only the app owner can do this.");
  }
  return identity.tokenIdentifier;
}

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function cleanReactions(value: unknown) {
  const source = asRecord(value);
  const reactions: Record<string, string[]> = {};
  Object.entries(source)
    .slice(0, 24)
    .forEach(([reaction, users]) => {
      if (!Array.isArray(users)) return;
      const key = reaction.slice(0, 24);
      reactions[key] = users
        .map((user) => String(user).slice(0, 160))
        .filter(Boolean)
        .slice(0, 80);
    });
  return reactions;
}

function cleanMessage(value: unknown, userId: string) {
  const message = asRecord(value);
  message.id = String(message.id ?? "").trim();
  message.channel = String(message.channel ?? "General").trim().slice(0, 80);
  message.author = String(message.author ?? "").trim().slice(0, 120);
  message.authorId = String(message.authorId ?? userId);
  message.authorAvatar =
    typeof message.authorAvatar === "string" && !message.authorAvatar.startsWith("data:")
      ? message.authorAvatar
      : "";
  message.content = String(message.content ?? "").trim().slice(0, 1000);
  message.image =
    typeof message.image === "string" && !message.image.startsWith("data:")
      ? message.image
      : "";
  message.attachments = Array.isArray(message.attachments)
    ? message.attachments
        .map((attachment) => asRecord(attachment))
        .map((attachment) => ({
          ...attachment,
          id: String(attachment.id ?? ""),
          name: String(attachment.name ?? "Attachment").slice(0, 90),
          kind: String(attachment.kind ?? "file"),
          type: String(attachment.type ?? "application/octet-stream").slice(0, 100),
          url:
            typeof attachment.url === "string" && !attachment.url.startsWith("data:")
              ? attachment.url
              : "",
          fileId:
            typeof attachment.fileId === "string" && attachment.fileId
              ? attachment.fileId
              : "",
          size: Number(attachment.size) || 0,
        }))
        .slice(0, 6)
    : [];
  message.voiceUrl =
    typeof message.voiceUrl === "string" && !message.voiceUrl.startsWith("data:")
      ? message.voiceUrl
      : "";
  message.time = String(message.time ?? new Date().toISOString());
  if (!message.id || !message.channel || !message.author) {
    throw new Error("Message needs an id, channel, and author.");
  }
  const serialized = JSON.stringify(message);
  if (serialized.length > 60_000 || serialized.includes("data:")) {
    throw new Error("Message payload is too large. Upload media through file storage first.");
  }
  return JSON.parse(serialized) as Record<string, unknown>;
}

async function withMessageMedia(ctx: QueryCtx, message: unknown) {
  const copy = asRecord(message);
  const imageFileId = copy.imageFileId;
  if (typeof imageFileId === "string" && imageFileId) {
    copy.image = (await ctx.storage.getUrl(imageFileId as Id<"_storage">)) ?? "";
  }
  const voiceFileId = copy.voiceFileId;
  if (typeof voiceFileId === "string" && voiceFileId) {
    copy.voiceUrl = (await ctx.storage.getUrl(voiceFileId as Id<"_storage">)) ?? "";
  }
  if (Array.isArray(copy.attachments)) {
    copy.attachments = await Promise.all(
      copy.attachments.map(async (attachment) => {
        const next = asRecord(attachment);
        if (typeof next.fileId === "string" && next.fileId) {
          next.url = (await ctx.storage.getUrl(next.fileId as Id<"_storage">)) ?? "";
        }
        return next;
      }),
    );
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
    const rows = await ctx.db.query("chatMessages").order("desc").take(120);
    const messages = await Promise.all(
      rows.reverse().map(async (row) => withMessageMedia(ctx, row.message)),
    );
    return messages;
  },
});

export const add = mutation({
  args: {
    messageId: v.string(),
    message: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const message = cleanMessage(args.message, userId);
    const existing = await ctx.db
      .query("chatMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("chatMessages", {
      messageId: args.messageId,
      channel: String(message.channel),
      message,
      createdAt: Date.now(),
      createdBy: userId,
    });
  },
});

export const updateContent = mutation({
  args: {
    messageId: v.string(),
    content: v.string(),
    editedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("chatMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (!existing) {
      throw new Error("Message was not found.");
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the message author can edit this message.");
    }
    const content = args.content.trim().slice(0, 1000);
    if (!content) {
      throw new Error("Message content cannot be empty.");
    }
    await ctx.db.patch(existing._id, {
      message: {
        ...asRecord(existing.message),
        content,
        editedAt: args.editedAt,
      },
    });
    return existing._id;
  },
});

export const setEngagement = mutation({
  args: {
    messageId: v.string(),
    likedBy: v.array(v.string()),
    reactions: v.any(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const existing = await ctx.db
      .query("chatMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (!existing) {
      throw new Error("Message was not found.");
    }
    await ctx.db.patch(existing._id, {
      message: {
        ...asRecord(existing.message),
        likedBy: args.likedBy.map((user) => user.slice(0, 160)).slice(0, 80),
        reactions: cleanReactions(args.reactions),
      },
    });
    return existing._id;
  },
});

export const remove = mutation({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("chatMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (!existing) {
      return null;
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the message author can delete this message.");
    }
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

export const adminRemove = mutation({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const existing = await ctx.db
      .query("chatMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (!existing) {
      return null;
    }
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
