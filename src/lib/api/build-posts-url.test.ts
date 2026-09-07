import { describe, expect, it } from "vitest";

import { buildPostsApiUrl } from "./build-posts-url";

describe("buildPostsApiUrl", () => {
  it("returns a relative api path without leading slash", () => {
    const url = buildPostsApiUrl("https://www.instagram.com/madj_store/");

    expect(url.startsWith("/")).toBe(false);
    expect(url).toBe(
      "api/posts?url=https%3A%2F%2Fwww.instagram.com%2Fmadj_store%2F",
    );
  });
});
