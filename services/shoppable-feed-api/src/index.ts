import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { config } from "./config.js";
import { cleanupExpiredJobs } from "./jobs/job-store.js";

setInterval(() => {
  cleanupExpiredJobs();
}, 60_000);

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.hostname,
  },
  (info) => {
    console.log(
      `shoppable-feed-api listening on http://${info.address}:${info.port}${config.basePath}`,
    );
  },
);
