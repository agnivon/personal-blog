import { format, toZonedTime } from "date-fns-tz";
import { DATE_FORMAT_STRING, TIMEZONE } from "./_config/env.config";
import { internalQuery } from "./_generated/server";

export const getTodaysTopics = internalQuery({
  handler: async (ctx, args) => {
    const currentDate = toZonedTime(new Date(), TIMEZONE);
    const formattedDate = format(currentDate, DATE_FORMAT_STRING);
    console.log(formattedDate);
    const topics = await ctx.db
      .query("topics")
      .filter((q) => q.eq(q.field("generationDate"), formattedDate))
      .collect();
    return topics;
  },
});
