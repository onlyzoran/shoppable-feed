import { randomUUID } from "node:crypto";

import { config } from "../config.js";
import type { JobStage, ParseJob, ParsedCatalog } from "../types.js";

const jobs = new Map<string, ParseJob>();
const waiters = new Map<string, Set<() => void>>();

function notifyWaiters(jobId: string) {
  for (const resolve of waiters.get(jobId) ?? []) {
    resolve();
  }
  waiters.delete(jobId);
}

function touchJob(job: ParseJob) {
  job.updatedAt = Date.now();
  notifyWaiters(job.id);
}

export function cleanupExpiredJobs(now = Date.now()) {
  for (const [jobId, job] of jobs) {
    if (now - job.updatedAt > config.jobTtlMs) {
      jobs.delete(jobId);
      waiters.delete(jobId);
    }
  }
}

function countRunningJobs() {
  let count = 0;
  for (const job of jobs.values()) {
    if (job.status === "pending" || job.status === "processing") {
      count += 1;
    }
  }
  return count;
}

export function canStartJob() {
  cleanupExpiredJobs();
  return countRunningJobs() < config.maxConcurrentJobs;
}

export function createJob(url: string, limit: number): ParseJob {
  cleanupExpiredJobs();
  const now = Date.now();
  const job: ParseJob = {
    id: randomUUID(),
    url,
    limit,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(jobId: string): ParseJob | null {
  cleanupExpiredJobs();
  return jobs.get(jobId) ?? null;
}

export function beginJobProcessing(jobId: string, stage: JobStage) {
  const job = jobs.get(jobId);
  if (!job || job.status !== "pending") {
    return;
  }

  job.status = "processing";
  job.stage = stage;
  touchJob(job);
}

export function updateJobStage(jobId: string, stage: JobStage) {
  const job = jobs.get(jobId);
  if (!job || job.status !== "processing") {
    return;
  }

  job.stage = stage;
  touchJob(job);
}

export function finishJob(jobId: string, catalog: ParsedCatalog) {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  job.status = "done";
  job.catalog = catalog;
  job.stage = undefined;
  job.error = undefined;
  touchJob(job);
}

export function failJob(jobId: string, error: string) {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  job.status = "failed";
  job.error = error;
  job.stage = undefined;
  touchJob(job);
}

export async function waitForJobChange(
  jobId: string,
  timeoutMs: number,
): Promise<ParseJob | null> {
  const job = getJob(jobId);
  if (!job || job.status === "done" || job.status === "failed") {
    return job;
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(getJob(jobId));
    }, timeoutMs);

    const onChange = () => {
      clearTimeout(timer);
      resolve(getJob(jobId));
    };

    const bucket = waiters.get(jobId) ?? new Set();
    bucket.add(onChange);
    waiters.set(jobId, bucket);
  });
}

export function resetJobStoreForTests() {
  jobs.clear();
  waiters.clear();
}
