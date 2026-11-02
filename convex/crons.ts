import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { CONVEX_ENV } from "./_config/env.config";

const crons = cronJobs();

if (CONVEX_ENV === "production") {
  crons.daily(
    "post daily article",
    {
      hourUTC: 5,
      minuteUTC: 30,
    },
    internal.jobs.postDailyArticle,
    {
      enabled: true,
    }
  );
}

export default crons;
