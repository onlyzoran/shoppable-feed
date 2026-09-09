import { Hono } from "hono";

import { config } from "./config.js";
import { createCatalogJobsRouter } from "./routes/catalog-jobs.js";

export function createApp() {
  const app = new Hono();

  app.route(config.basePath, createCatalogJobsRouter());
  app.get("/", (c) =>
    c.json({
      service: "shoppable-feed-api",
      health: `${config.basePath}/health`,
    }),
  );

  return app;
}

export const app = createApp();
