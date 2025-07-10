import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { CONVEX_ENV } from "./_config/env.config";

const crons = cronJobs();

crons.daily(
  "post daily article",
  {
    hourUTC: 5,
    minuteUTC: 30,
  },
  internal.jobs.postDailyArticle,
  {
    enabled: CONVEX_ENV === "production",
  }
);

export default crons;
