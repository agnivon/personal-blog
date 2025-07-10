import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const postDailyArticle = internalAction({
  args: { enabled: v.boolean() },
  async handler(ctx, args) {
    try {
      if (args.enabled) {
        const todaysTopics = await ctx.runQuery(
          internal.queries.getTodaysTopics,
          {}
        );
        if (todaysTopics.length > 0) {
          console.info(`Found ${todaysTopics.length} topics`);
          await Promise.all(
            todaysTopics.map(async ({ topic }, idx) => {
              console.log(`Scheduling ${topic}`);
              return ctx.scheduler.runAfter(
                idx * 1000 * 60,
                internal.actions.generateArticle,
                {
                  topic: topic,
                }
              );
            })
          );
        } else {
          console.info("No topics found");
        }
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
});
