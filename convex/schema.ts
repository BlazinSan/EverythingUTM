import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  appState: defineTable({
    storageKey: v.string(),
    data: v.any(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_storageKey", ["storageKey"]),

  profiles: defineTable({
    userId: v.string(),
    clerkUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.string(),
    usernameNormalized: v.string(),
    name: v.string(),
    faculty: v.optional(v.string()),
    profile: v.any(),
    saved: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_usernameNormalized", ["usernameNormalized"])
    .searchIndex("search_username", {
      searchField: "username",
      filterFields: ["saved"],
    }),

  bugReports: defineTable({
    userId: v.optional(v.string()),
    userName: v.string(),
    userEmail: v.string(),
    details: v.string(),
    reportedAt: v.number(),
    reportedAtLocal: v.string(),
    emailed: v.boolean(),
    emailError: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
