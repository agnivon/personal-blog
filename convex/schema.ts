import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  topics: defineTable({
    topic: v.string(),
    instructions: v.optional(v.string()),
    generationDate: v.string(),
  }),
});
