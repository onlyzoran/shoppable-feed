import { Hono } from "hono";

import { config } from "../config.js";
import { runParseJob } from "../jobs/run-parse-job.js";
import {
  canStartJob,
  createJob,
  getJob,
  waitForJobChange,
} from "../jobs/job-store.js";
import type { CreateJobRequest, JobResponse } from "../types.js";
import { normalizeOrigin } from "../parsers/normalize.js";

function buildPollUrl(jobId: string) {
  return `${config.basePath}/v1/catalog/jobs/${jobId}`;
}

function toJobResponse(job: NonNullable<ReturnType<typeof getJob>>): JobResponse {
  return {
    jobId: job.id,
    status: job.status,
    stage: job.stage,
    pollUrl: buildPollUrl(job.id),
    catalog: job.catalog,
    error: job.error,
  };
}

function parseLimit(raw: unknown): number {
  if (raw == null) {
    return config.defaultLimit;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("limit must be a positive number");
  }

  return Math.min(Math.floor(value), config.maxLimit);
}

function parseWaitSeconds(raw: string | undefined): number {
  if (!raw) {
    return 0;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.min(value, config.maxLongPollWaitSec);
}

export function createCatalogJobsRouter() {
  const router = new Hono();

  router.post("/v1/catalog/jobs", async (c) => {
    let body: CreateJobRequest;
    try {
      body = await c.req.json<CreateJobRequest>();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const url = body.url?.trim();
    if (!url) {
      return c.json({ error: "url is required" }, 400);
    }

    let limit: number;
    try {
      limit = parseLimit(body.limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid limit";
      return c.json({ error: message }, 400);
    }

    try {
      normalizeOrigin(url);
    } catch {
      return c.json({ error: "url must be a valid http(s) URL" }, 400);
    }

    if (!canStartJob()) {
      return c.json(
        { error: "Too many concurrent parsing jobs. Try again later." },
        429,
      );
    }

    const job = createJob(url, limit);
    runParseJob(job.id, url, limit);

    return c.json(toJobResponse(job), 202);
  });

  router.get("/v1/catalog/jobs/:jobId", async (c) => {
    const jobId = c.req.param("jobId");
    let job = getJob(jobId);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    const waitSeconds = parseWaitSeconds(c.req.query("wait"));
    if (
      waitSeconds > 0 &&
      job.status !== "done" &&
      job.status !== "failed"
    ) {
      job = (await waitForJobChange(jobId, waitSeconds * 1000)) ?? job;
    }

    return c.json(toJobResponse(job));
  });

  router.get("/health", (c) => c.json({ ok: true }));

  return router;
}
