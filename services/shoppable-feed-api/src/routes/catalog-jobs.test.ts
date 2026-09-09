import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../app.js";
import { resetJobStoreForTests } from "../jobs/job-store.js";

beforeEach(() => {
  resetJobStoreForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("catalog jobs API", () => {
  it("creates a job and returns parsed catalog", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("products.json?limit=1")) {
          return new Response(
            JSON.stringify({
              products: [{ id: 1, title: "Runner", handle: "runner" }],
            }),
            { status: 200 },
          );
        }

        if (String(url).includes("products.json")) {
          return new Response(
            JSON.stringify({
              products: [
                {
                  id: 1,
                  title: "Runner",
                  handle: "runner",
                  variants: [{ price: "110.00" }],
                  images: [{ src: "https://cdn.example.com/runner.jpg" }],
                },
              ],
            }),
            { status: 200 },
          );
        }

        return new Response("not found", { status: 404 });
      }),
    );

    const createResponse = await app.request("/shoppable-feed-api/v1/catalog/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://www.allbirds.com", limit: 5 }),
    });

    expect(createResponse.status).toBe(202);
    const created = await createResponse.json();
    expect(["pending", "processing"]).toContain(created.status);
    expect(created.pollUrl).toContain(created.jobId);

    let finalJob = created;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (finalJob.status === "done" || finalJob.status === "failed") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 25));
      const pollResponse = await app.request(
        `/shoppable-feed-api/v1/catalog/jobs/${created.jobId}`,
      );
      finalJob = await pollResponse.json();
    }

    expect(finalJob.status).toBe("done");
    expect(finalJob.catalog.platform).toBe("shopify");
    expect(finalJob.catalog.products.length).toBeLessThanOrEqual(5);
  });

  it("validates url and limit", async () => {
    const missingUrl = await app.request("/shoppable-feed-api/v1/catalog/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 10 }),
    });
    expect(missingUrl.status).toBe(400);

    const badLimit = await app.request("/shoppable-feed-api/v1/catalog/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://allbirds.com", limit: 0 }),
    });
    expect(badLimit.status).toBe(400);
  });

  it("returns health endpoint", async () => {
    const response = await app.request("/shoppable-feed-api/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
