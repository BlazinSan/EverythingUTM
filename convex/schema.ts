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

  questions: defineTable({
    questionId: v.string(),
    question: v.any(),
    createdAt: v.number(),
    createdBy: v.string(),
  }).index("by_questionId", ["questionId"]),

  questionAnswers: defineTable({
    answerId: v.string(),
    questionId: v.string(),
    answer: v.any(),
    createdAt: v.number(),
    createdBy: v.string(),
  })
    .index("by_questionId_and_createdAt", ["questionId", "createdAt"])
    .index("by_answerId", ["answerId"]),

  profileReviews: defineTable({
    reviewId: v.string(),
    review: v.any(),
    profileName: v.string(),
    reviewerId: v.string(),
    createdAt: v.number(),
  }).index("by_reviewId", ["reviewId"]),

  campusLocations: defineTable({
    locationId: v.string(),
    location: v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      lat: v.number(),
      lng: v.number(),
      area: v.string(),
      blurb: v.string(),
      bestFor: v.array(v.string()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
  }).index("by_locationId", ["locationId"]),

  marketplaceListings: defineTable({
    listingId: v.string(),
    listing: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.string()),
  }).index("by_listingId", ["listingId"]),

  chatMessages: defineTable({
    messageId: v.string(),
    channel: v.string(),
    message: v.any(),
    createdAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.string()),
  })
    .index("by_messageId", ["messageId"])
    .index("by_channel_and_createdAt", ["channel", "createdAt"]),

  chatTyping: defineTable({
    userId: v.string(),
    channel: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    updatedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_channel_and_expiresAt", ["channel", "expiresAt"])
    .index("by_userId_and_channel", ["userId", "channel"]),

  serviceRequests: defineTable({
    requestId: v.string(),
    request: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
    deletedAt: v.optional(v.string()),
  }).index("by_requestId", ["requestId"]),
});
