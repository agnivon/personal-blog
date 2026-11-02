import { format, toZonedTime } from "date-fns-tz";
import { DATE_FORMAT_STRING, TIMEZONE } from "./_config/env.config";
import { internalQuery } from "./_generated/server";

export const getTodaysTopics = internalQuery({
  handler: async (ctx) => {
    const currentDate = toZonedTime(new Date(), TIMEZONE);
    const formattedDate = format(currentDate, DATE_FORMAT_STRING);
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_generationDate", (q) =>
        q.eq("generationDate", formattedDate)
      )
      .collect();
    return topics;
  },
});
