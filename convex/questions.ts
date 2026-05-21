import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const rows = await ctx.db.query("questions").order("desc").take(20);
    return rows.map((row) => row.question);
  },
});

export const add = mutation({
  args: {
    question: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in.");
    }
    const questionId =
      typeof args.question === "object" &&
      args.question !== null &&
      "id" in args.question
        ? String((args.question as { id?: unknown }).id ?? "")
        : "";
    if (!questionId) {
      throw new Error("Question id is required.");
    }
    const question =
      typeof args.question === "object" && args.question !== null
        ? {
            ...args.question,
            image: "",
          }
        : args.question;
    const serialized = JSON.stringify(question);
    if (serialized.length > 20_000 || serialized.includes("data:")) {
      throw new Error("Question payload is too large.");
    }
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
      .unique();
    const row = {
      questionId,
      question,
      createdAt: Date.now(),
      createdBy: identity.tokenIdentifier,
    };
    if (existing) {
      await ctx.db.patch(existing._id, row);
      return existing._id;
    }
    return await ctx.db.insert("questions", row);
  },
});
