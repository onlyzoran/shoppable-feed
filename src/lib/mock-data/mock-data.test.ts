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

  it("matches bananhot profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/bananhot/",
    );

    expect(example?.id).toBe("bananhot");
    expect(example?.fileName).toBe("bananhot.json");
  });

  it("matches adah profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/adah.usa/",
    );

    expect(example?.id).toBe("adah.usa");
    expect(example?.fileName).toBe("adahlazorgan.json");
  });

  it("matches wildflowercases profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/wildflowercases/",
    );

    expect(example?.id).toBe("wildflowercases");
    expect(example?.fileName).toBe("wildflowercases.json");
  });

  it("matches meundies profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/meundies/",
    );

    expect(example?.id).toBe("meundies");
    expect(example?.fileName).toBe("meundies.json");
  });

  it("matches brooklinen profile URL", () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/brooklinen/",
    );

    expect(example?.id).toBe("brooklinen");
    expect(example?.fileName).toBe("brooklinen.json");
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
      kind: "link",
      label: "Магазин",
      url: "https://manekenbrand.com/",
    });
    expect(buttons[1]).toMatchObject({
      kind: "product",
      label: "Костюм Core Edition Legacy",
      url: "https://manekenbrand.com/catalog/women/firmennye_kostyumy_1/bez_nachesa_3/kostyum_core_edition_legacy_18_s_bryukami_molochnyy/",
      price: "24 500 ₽",
      imageUrl: expect.stringMatching(/^https:\/\//),
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
        kind: "link",
        label: "Записаться",
        url: "https://yclients.com/salon/city-nails/135934/",
      },
      {
        kind: "link",
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
    expect(buildShoppableButtonsForPost(posts[0])[1]).toMatchObject({
      kind: "product",
      label: "PACK SUEÑO REPARADOR",
      url: "https://www.thegrezway.cl/products/pack-sueno-reparador-descanso-profundo-apagado-mental-copia",
      price: "$63.184",
      imageUrl: expect.stringMatching(/^https:\/\//),
    });
  });

  it("loads bananhot posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/bananhot/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 12);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0].username).toBe("bananhot");
    expect(buildShoppableButtonsForPost(posts[0])[0]).toMatchObject({
      label: "Магазин",
      url: "https://bananhot.com/",
    });

    const productPost = posts.find((post) =>
      post.caption.toLowerCase().includes("rosalie bari chevron"),
    );
    expect(productPost).toBeDefined();
    expect(buildShoppableButtonsForPost(productPost!)[1]).toMatchObject({
      kind: "product",
      label: "ROSALIE BARI CHEVRON",
      url: expect.stringContaining("bananhot.com/products/rosalie-bari-chevron"),
      price: expect.stringMatching(/^\$/),
      imageUrl: expect.stringMatching(/^https:\/\//),
    });
  });

  it("loads adah posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/adah.usa/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 12);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0].username).toBe("adah.usa");
    expect(buildShoppableButtonsForPost(posts[0])[0]).toMatchObject({
      label: "Магазин",
      url: "https://adahlazorgan.com/",
    });

    const productPost = posts.find((post) =>
      post.caption.toLowerCase().includes("brow wax"),
    );
    expect(productPost).toBeDefined();
    expect(buildShoppableButtonsForPost(productPost!)[1]).toMatchObject({
      kind: "product",
      label: "BROW WAX",
      url: expect.stringContaining("adahlazorgan.com/products/brow-wax"),
      price: expect.stringMatching(/^\$/),
      imageUrl: expect.stringMatching(/^https:\/\//),
    });
  });

  it("loads wildflower posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/wildflowercases/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 12);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0].username).toBe("wildflowercases");
    expect(buildShoppableButtonsForPost(posts[0])[0]).toMatchObject({
      label: "Магазин",
      url: "https://www.wildflowercases.com/",
    });

    const ahoyPost = posts.find((post) =>
      post.caption.toLowerCase().includes("ahoy babe"),
    );
    expect(ahoyPost).toBeDefined();
    expect(buildShoppableButtonsForPost(ahoyPost!)[1]).toMatchObject({
      kind: "product",
      label: "Ahoy Babe",
      url: expect.stringContaining(
        "wildflowercases.com/products/ahoy-babe-nautical-iphone-case",
      ),
      price: "$37",
      imageUrl: expect.stringMatching(/^https:\/\//),
    });

    const polkaPost = posts.find((post) =>
      post.caption.toLowerCase().includes("polkadot"),
    );
    expect(polkaPost).toBeDefined();
    expect(
      buildShoppableButtonsForPost(polkaPost!).some(
        (button) =>
          button.kind === "product" &&
          button.label === "Polka Dot | Turquoise and Black",
      ),
    ).toBe(true);
  });

  it("loads meundies posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/meundies/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 12);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0].username).toBe("meundies");
    expect(buildShoppableButtonsForPost(posts[0])[0]).toMatchObject({
      label: "Магазин",
      url: "https://www.meundies.com/",
    });

    const moonwalkPost = posts.find((post) =>
      post.caption.toLowerCase().includes("moonwalk"),
    );
    expect(moonwalkPost).toBeDefined();
    expect(
      buildShoppableButtonsForPost(moonwalkPost!).some(
        (button) => button.kind === "product" && button.label === "Moonwalk",
      ),
    ).toBe(true);
    expect(
      buildShoppableButtonsForPost(moonwalkPost!).some(
        (button) =>
          button.kind === "product" && button.label === "Alien Arcade",
      ),
    ).toBe(true);

    const jurassicPost = posts.find((post) =>
      post.caption.toLowerCase().includes("jurassic park"),
    );
    expect(jurassicPost).toBeDefined();
    expect(buildShoppableButtonsForPost(jurassicPost!)[1]).toMatchObject({
      kind: "product",
      label: "Jurassic Park x MeUndies",
      url: expect.stringContaining(
        "meundies.com/products/boxer-brief-life-finds-a-way",
      ),
      price: "$26",
    });
  });

  it("loads brooklinen posts with catalog buttons", async () => {
    const example = findExampleByProfileUrl(
      "https://www.instagram.com/brooklinen/",
    );

    expect(example).not.toBeNull();
    const posts = await loadExamplePosts(example!, 12);

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0].username).toBe("brooklinen");
    expect(buildShoppableButtonsForPost(posts[0])[0]).toMatchObject({
      label: "Магазин",
      url: "https://www.brooklinen.com/",
    });

    const bestSheetsPost = posts.find((post) =>
      post.caption.toLowerCase().includes("best sheets ever"),
    );
    expect(bestSheetsPost).toBeDefined();
    expect(buildShoppableButtonsForPost(bestSheetsPost!)[1]).toMatchObject({
      kind: "product",
      label: "Classic Percale Core Sheet Set",
      url: expect.stringContaining("brooklinen.com/products/classic-core-sheet-set"),
      price: "$159",
      imageUrl: expect.stringMatching(/^https:\/\//),
    });

    const upgradePost = posts.find((post) =>
      post.caption.toLowerCase().includes("desert stripe in avocado"),
    );
    expect(upgradePost).toBeDefined();
    const upgradeButtons = buildShoppableButtonsForPost(upgradePost!).filter(
      (button) => button.kind === "product",
    );
    expect(upgradeButtons.map((button) => button.label)).toEqual([
      "Desert Stripe Avocado",
      "Heritage Wool Throw",
    ]);
  });
});
