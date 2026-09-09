import { config } from "../config.js";
import { parseCatalogFromUrl } from "../parsers/index.js";
import {
  beginJobProcessing,
  failJob,
  finishJob,
  updateJobStage,
} from "./job-store.js";

export function runParseJob(jobId: string, url: string, limit: number) {
  void (async () => {
    beginJobProcessing(jobId, "detecting");

    const timeout = setTimeout(() => {
      failJob(jobId, "Parsing timed out after 60 seconds");
    }, config.jobTimeoutMs);

    try {
      const catalog = await parseCatalogFromUrl(url, limit, (stage) => {
        updateJobStage(jobId, stage);
      });
      finishJob(jobId, catalog);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown parsing error";
      failJob(jobId, message);
    } finally {
      clearTimeout(timeout);
    }
  })();
}
