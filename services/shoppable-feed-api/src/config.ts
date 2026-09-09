export const config = {
  port: Number(process.env.PORT ?? 3006),
  hostname: process.env.HOSTNAME ?? "127.0.0.1",
  basePath: (process.env.BASE_PATH ?? "/shoppable-feed-api").replace(/\/$/, ""),
  jobTtlMs: 15 * 60 * 1000,
  jobTimeoutMs: 60 * 1000,
  maxConcurrentJobs: 3,
  defaultLimit: 30,
  maxLimit: 50,
  maxLongPollWaitSec: 30,
  userAgent: "Mozilla/5.0 (compatible; ShoppableFeedBot/1.0)",
};
