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

async function requireUserAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in.");
  }
  return {
    userId: identity.tokenIdentifier,
    keys: [identity.tokenIdentifier, identity.subject].filter(Boolean),
  };
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

function safeText(value: unknown, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

function safeRemoteUrl(value: unknown) {
  return typeof value === "string" && !value.startsWith("data:")
    ? value.slice(0, 2000)
    : "";
}

function cleanAnswer(value: unknown, userId: string) {
  const answer = asRecord(value);
  const clean = {
    id: safeText(answer.id, 80),
    author: safeText(answer.author, 120),
    authorId: safeText(answer.authorId ?? userId, 160),
    authorAvatar: safeRemoteUrl(answer.authorAvatar),
    body: safeText(answer.body, 1400),
    image: safeRemoteUrl(answer.image),
    helpful: Math.max(0, Math.min(9999, Number(answer.helpful) || 0)),
    helpfulBy: Array.isArray(answer.helpfulBy)
      ? answer.helpfulBy.map((id) => String(id).slice(0, 160)).slice(0, 120)
      : [],
    time: safeText(answer.time, 80) || new Date().toISOString(),
  };
  if (!clean.id || !clean.author || !clean.body) {
    throw new Error("Answer needs an author and body.");
  }
  return clean;
}

function cleanQuestion(value: unknown, userId: string) {
  const question = asRecord(value);
  const clean = {
    id: safeText(question.id, 80),
    title: safeText(question.title, 120),
    body: safeText(question.body, 1800),
    author: safeText(question.author, 120),
    authorId: safeText(question.authorId ?? userId, 160),
    authorAvatar: safeRemoteUrl(question.authorAvatar),
    image: safeRemoteUrl(question.image),
    tags: Array.isArray(question.tags)
      ? question.tags.map((tag) => safeText(tag, 32)).filter(Boolean).slice(0, 12)
      : [],
    votes: Math.max(-9999, Math.min(9999, Number(question.votes) || 0)),
    resolved: Boolean(question.resolved),
    createdAt: safeText(question.createdAt, 80) || new Date().toISOString(),
    editedAt: safeText(question.editedAt, 80) || undefined,
    answers: [],
  };
  if (!clean.id || !clean.title || !clean.body || !clean.author) {
    throw new Error("Question needs a title, details, and author.");
  }
  const serialized = JSON.stringify(clean);
  if (serialized.length > 60_000 || serialized.includes("data:")) {
    throw new Error("Question payload is too large.");
  }
  return JSON.parse(serialized) as Record<string, unknown>;
}

function mergeAnswers(legacyAnswers: unknown[], onlineAnswers: unknown[]) {
  const answersById = new Map<string, unknown>();

  for (const answer of legacyAnswers) {
    const entry = asRecord(answer);
    const id = safeText(entry.id, 80);
    if (id) {
      answersById.set(id, answer);
    }
  }

  for (const answer of onlineAnswers) {
    const entry = asRecord(answer);
    const id = safeText(entry.id, 80);
    if (id) {
      answersById.set(id, answer);
    }
  }

  return Array.from(answersById.values()).slice(-80);
}

async function deleteQuestionAnswers(ctx: MutationCtx, questionId: string) {
  const answers = await ctx.db
    .query("questionAnswers")
    .withIndex("by_questionId_and_createdAt", (q) =>
      q.eq("questionId", questionId),
    )
    .take(100);
  for (const answer of answers) {
    await ctx.db.delete(answer._id);
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const rows = await ctx.db.query("questions").order("desc").take(80);
    return await Promise.all(
      rows.map(async (row) => {
        const question = asRecord(row.question);
        const legacyAnswers = Array.isArray(question.answers)
          ? question.answers
          : [];
        const answerRows = await ctx.db
          .query("questionAnswers")
          .withIndex("by_questionId_and_createdAt", (q) =>
            q.eq("questionId", row.questionId),
          )
          .order("asc")
          .take(80);
        return {
          ...question,
          answers: mergeAnswers(
            legacyAnswers,
            answerRows.map((answerRow) => answerRow.answer),
          ),
        };
      }),
    );
  },
});

export const add = mutation({
  args: {
    question: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const question = cleanQuestion(args.question, userId);
    const questionId = String(question.id);
    if (!questionId) {
      throw new Error("Question id is required.");
    }
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
      .unique();
    if (existing && existing.createdBy !== userId) {
      throw new Error("Only the question author can update this question.");
    }
    const row = {
      questionId,
      question,
      createdAt: Date.now(),
      createdBy: userId,
    };
    if (existing) {
      await ctx.db.patch(existing._id, row);
      return existing._id;
    }
    return await ctx.db.insert("questions", row);
  },
});

export const update = mutation({
  args: {
    questionId: v.string(),
    question: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      throw new Error("Question was not found.");
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the question author can update this question.");
    }
    const question = cleanQuestion(args.question, userId);
    await ctx.db.patch(existing._id, { question });
    return existing._id;
  },
});

export const addAnswer = mutation({
  args: {
    questionId: v.string(),
    answer: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, keys } = await requireUserAuth(ctx);
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      throw new Error("Question was not found.");
    }
    const question = asRecord(existing.question);
    if (question.resolved) {
      throw new Error("This question is resolved and locked.");
    }
    const answer = cleanAnswer(args.answer, userId);
    const questionAuthorId = safeText(question.authorId, 160);
    if (
      keys.includes(existing.createdBy) ||
      keys.includes(questionAuthorId) ||
      (answer.authorId && questionAuthorId && answer.authorId === questionAuthorId)
    ) {
      throw new Error("You cannot answer your own question.");
    }
    const existingAnswer = await ctx.db
      .query("questionAnswers")
      .withIndex("by_answerId", (q) => q.eq("answerId", answer.id))
      .unique();
    if (existingAnswer) {
      return existing._id;
    }
    await ctx.db.insert("questionAnswers", {
      answerId: answer.id,
      questionId: args.questionId,
      answer,
      createdAt: Date.now(),
      createdBy: userId,
    });
    return existing._id;
  },
});

export const setVotes = mutation({
  args: {
    questionId: v.string(),
    votes: v.number(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      throw new Error("Question was not found.");
    }
    await ctx.db.patch(existing._id, {
      question: {
        ...asRecord(existing.question),
        votes: Math.max(-9999, Math.min(9999, args.votes)),
      },
    });
    return existing._id;
  },
});

export const setAnswerHelpful = mutation({
  args: {
    questionId: v.string(),
    answerId: v.string(),
    helpful: v.number(),
    helpfulBy: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const answerRow = await ctx.db
      .query("questionAnswers")
      .withIndex("by_answerId", (q) => q.eq("answerId", args.answerId))
      .unique();
    if (answerRow) {
      await ctx.db.patch(answerRow._id, {
        answer: {
          ...asRecord(answerRow.answer),
          helpful: Math.max(0, Math.min(9999, args.helpful)),
          helpfulBy: args.helpfulBy
            .map((id) => id.slice(0, 160))
            .filter(Boolean)
            .slice(0, 120),
        },
      });
      return answerRow._id;
    }

    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      throw new Error("Question was not found.");
    }
    const question = asRecord(existing.question);
    const answers = Array.isArray(question.answers) ? question.answers : [];
    await ctx.db.patch(existing._id, {
      question: {
        ...question,
        answers: answers.map((answer) => {
          const entry = asRecord(answer);
          if (entry.id !== args.answerId) return answer;
          return {
            ...entry,
            helpful: Math.max(0, Math.min(9999, args.helpful)),
            helpfulBy: args.helpfulBy
              .map((id) => id.slice(0, 160))
              .filter(Boolean)
              .slice(0, 120),
          };
        }),
      },
    });
    return existing._id;
  },
});

export const removeAnswer = mutation({
  args: {
    questionId: v.string(),
    answerId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, keys } = await requireUserAuth(ctx);
    const answerRow = await ctx.db
      .query("questionAnswers")
      .withIndex("by_answerId", (q) => q.eq("answerId", args.answerId))
      .unique();
    if (answerRow) {
      if (answerRow.createdBy !== userId) {
        throw new Error("Only the answer author can delete this answer.");
      }
      await ctx.db.delete(answerRow._id);
      return answerRow._id;
    }

    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      return null;
    }
    const question = asRecord(existing.question);
    const answers = Array.isArray(question.answers) ? question.answers : [];
    const target = answers.find((answer) => asRecord(answer).id === args.answerId);
    if (!target) {
      return null;
    }
    if (!keys.includes(safeText(asRecord(target).authorId, 160))) {
      throw new Error("Only the answer author can delete this answer.");
    }
    await ctx.db.patch(existing._id, {
      question: {
        ...question,
        answers: answers.filter(
          (answer) => asRecord(answer).id !== args.answerId,
        ),
      },
    });
    return existing._id;
  },
});

export const setResolved = mutation({
  args: {
    questionId: v.string(),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      throw new Error("Question was not found.");
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the question author can change resolved status.");
    }
    await ctx.db.patch(existing._id, {
      question: {
        ...asRecord(existing.question),
        resolved: args.resolved,
      },
    });
    return existing._id;
  },
});

export const remove = mutation({
  args: {
    questionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      return null;
    }
    if (existing.createdBy !== userId) {
      throw new Error("Only the question author can delete this question.");
    }
    await deleteQuestionAnswers(ctx, args.questionId);
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

export const adminRemove = mutation({
  args: {
    questionId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .unique();
    if (!existing) {
      return null;
    }
    await deleteQuestionAnswers(ctx, args.questionId);
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
