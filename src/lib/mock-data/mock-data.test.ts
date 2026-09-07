import { readFileSync } from "fs";
import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { buildShoppableButtonsForPost } from "@/lib/shoppable/generate-buttons";

import {
  EXAMPLE_SOURCES,
  findExampleByProfileUrl,
  isRealInstagramPermalink,
} from "./examples";
import { loadExamplePosts } from "./load-example-posts";
import { mapVendorPayloadToPosts } from "./parse-vendor-payload";
import type { VendorPayload } from "./types";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readMockPayload(name: string): VendorPayload {
  const raw = readFileSync(join(repoRoot, "mock-data", name), "utf8");
  return JSON.parse(raw) as VendorPayload;
}

function hasMockPosts(example: (typeof EXAMPLE_SOURCES)[number]): boolean {
  if (!example.fileName) {
    return false;
  }

  const payload = readMockPayload(example.fileName);
  return (payload.payload?.length ?? 0) > 0;
}

describe("findExampleByProfileUrl", () => {
  it("matches canonical profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/manekenbrand/",
    );

    expect(example?.id).toBe("manekenbrand");
    expect(example?.fileName).toBe("manekenbrand.json");
  });

  it("matches username-only suffix", () => {
    const example = findExampleByProfileUrl(
      "https://instagram.com/manekenbrand",
    );

    expect(example?.id).toBe("manekenbrand");
  });

  it("matches madj_store profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/madj_store/",
    );

    expect(example?.id).toBe("madj_store");
    expect(example?.fileName).toBe("madj_store.json");
  });

  it("matches dropsstore profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/dropsstore.ru/",
    );

    expect(example?.id).toBe("dropsstore.ru");
    expect(example?.fileName).toBe("dropsstore.json");
  });

  it("matches citynails profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/citynails_moscow/",
    );

    expect(example?.id).toBe("citynails_moscow");
    expect(example?.fileName).toBe("citynails.json");
  });

  it("matches grez profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/thegrezwaycl/",
    );

    expect(example?.id).toBe("thegrezwaycl");
    expect(example?.fileName).toBe("thegrezway.json");
  });

  it("returns null for unknown profile", () => {
    expect(
      findExampleByProfileUrl("https://www.instagram.com/unknown-brand/"),
    ).toBeNull();
  });
});

describe("mapVendorPayloadToPosts", () => {
  it("maps manekenbrand mock payload into feed posts", () => {
    const payload = readMockPayload("manekenbrand.json");
    const posts = mapVendorPayloadToPosts(payload, "manekenbrand", 12);

    expect(posts.length).toBe(12);
    expect(posts[0]).toMatchObject({
      username: "manekenbrand",
      caption: expect.stringContaining("костюм"),
      permalink: expect.stringMatching(/^https:\/\/www\.instagram\.com\/p\//),
    });
    expect(isRealInstagramPermalink(posts[0].permalink)).toBe(true);
  });

  it("maps reels as video posts", () => {
    const payload = readMockPayload("manekenbrand.json");
    const posts = mapVendorPayloadToPosts(payload, "manekenbrand", 60);
    const reel = posts.find((post) => post.mediaType === "video");

    expect(reel).toBeDefined();
    expect(reel?.mediaUrl).toMatch(/\.mp4|cdninstagram\.com/);
  });
});

describe("loadExamplePosts", () => {
  it("loads manekenbrand posts with shoppable buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/manekenbrand/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 10);

    expect(posts).toHaveLength(10);
    expect(posts[0].username).toBe("manekenbrand");

    const buttons = buildShoppableButtonsForPost(posts[0]);
    expect(buttons[0]).toEqual({
      label: "Магазин",
      url: "https://manekenbrand.com/",
    });
    expect(buttons[1]).toEqual({
      label: "Костюм Core Edition Legacy",
      url: "https://manekenbrand.com/catalog/women/firmennye_kostyumy_1/bez_nachesa_3/kostyum_core_edition_legacy_18_s_bryukami_molochnyy/",
    });

    const postWithUrl = posts.find((post) =>
      post.caption.includes("https://manekenbrand.com"),
    );
    expect(postWithUrl).toBeDefined();
    expect(buildShoppableButtonsForPost(postWithUrl!)[0]?.url).toBe(
      "https://manekenbrand.com/",
    );
  });

  it.each(
    EXAMPLE_SOURCES.filter(hasMockPosts).map((example) => [example.label, example]),
  )(
    "loads %s example with real Instagram permalinks",
    async (_label, example) => {
      const posts = await loadExamplePosts(example, 10);

      expect(posts.length).toBeGreaterThanOrEqual(10);
      expect(posts[0].username).toBe(example.id);
      expect(posts.every((post) => isRealInstagramPermalink(post.permalink))).toBe(
        true,
      );
      expect(
        posts.every((post) => !post.mediaUrl.includes("picsum.photos")),
      ).toBe(true);
      expect(buildShoppableButtonsForPost(posts[0]).length).toBeGreaterThan(0);
    },
  );

  it("loads madj_store posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/madj_store/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 12);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(buildShoppableButtonsForPost(posts[0])[0]).toMatchObject({
      label: "Магазин",
      url: "https://madj.store/",
    });
  });

  it("loads dropsstore posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/dropsstore.ru/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 10);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(buildShoppableButtonsForPost(posts[0])[0]).toMatchObject({
      label: "Магазин",
      url: "https://www.dropsstore.ru/",
    });
  });

  it("loads citynails posts with booking buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/citynails_moscow/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 10);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(buildShoppableButtonsForPost(posts[0])).toEqual([
      {
        label: "Записаться",
        url: "https://yclients.com/salon/city-nails/135934/",
      },
      {
        label: "Салон",
        url: "https://citynails.studio/",
      },
    ]);
  });

  it("loads grez posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/thegrezwaycl/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 12);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0].username).toBe("thegrezwaycl");
    expect(buildShoppableButtonsForPost(posts[0])).toEqual([
      {
        label: "Магазин",
        url: "https://www.thegrezway.cl/",
      },
      {
        label: "PACK SUEÑO REPARADOR",
        url: "https://www.thegrezway.cl/products/pack-sueno-reparador-descanso-profundo-apagado-mental-copia",
      },
    ]);
  });
});
