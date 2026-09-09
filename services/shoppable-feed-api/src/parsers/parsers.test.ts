import { afterEach, describe, expect, it, vi } from "vitest";

import { parseHtmlCatalog } from "./html.js";
import { extractTildaApiUrl, parseTildaCatalog } from "./tilda.js";
import { tryParseShopifyCatalog } from "./shopify.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("extractTildaApiUrl", () => {
  it("extracts tilda api url from homepage html", () => {
    const html = `
      fetch("https://store.tildaapi.com/api/getproductslist/?storepartuid=606657650631&recid=564342696&c=6845764&size=100")
    `;

    expect(extractTildaApiUrl(html)).toBe(
      "https://store.tildaapi.com/api/getproductslist/?storepartuid=606657650631&recid=564342696&c=6845764&size=100",
    );
  });
});

describe("tryParseShopifyCatalog", () => {
  it("maps shopify products with dedupe and limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("limit=1")) {
          return new Response(
            JSON.stringify({ products: [{ id: 1, title: "Carry-On - Black", handle: "carry-on" }] }),
            { status: 200 },
          );
        }

        return new Response(
          JSON.stringify({
            products: [
              {
                id: 1,
                title: "Carry-On - Black",
                handle: "carry-on",
                variants: [{ price: "275.00" }],
                images: [{ src: "https://cdn.example.com/carry-on.jpg" }],
              },
              {
                id: 2,
                title: "Carry-On - White",
                handle: "carry-on-white",
                variants: [{ price: "275.00" }],
                images: [{ src: "https://cdn.example.com/carry-on-white.jpg" }],
              },
              {
                id: 3,
                title: "Garment Bag",
                handle: "garment-bag",
                variants: [{ price: "95.00" }],
                images: [{ src: "https://cdn.example.com/garment.jpg" }],
              },
            ],
          }),
          { status: 200 },
        );
      }),
    );

    const catalog = await tryParseShopifyCatalog("https://awaytravel.com", 2);

    expect(catalog).toMatchObject({
      platform: "shopify",
      storeHostname: "awaytravel.com",
    });
    expect(catalog?.products).toHaveLength(2);
    expect(catalog?.products[0]).toMatchObject({
      label: "Carry-On",
      price: "$275",
      url: "https://awaytravel.com/products/carry-on",
    });
  });

  it("returns null when products.json is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );

    await expect(tryParseShopifyCatalog("https://example.com", 10)).resolves.toBeNull();
  });
});

describe("parseTildaCatalog", () => {
  it("maps tilda products", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            products: [
              {
                title: "Платье Luna",
                url: "https://madj.store/tproduct/123-luna",
                price: "18900",
                editions: [{ img: "https://cdn.example.com/luna.jpg" }],
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const catalog = await parseTildaCatalog(
      "https://store.tildaapi.com/api/getproductslist/?storepartuid=1&recid=2&c=3&size=100",
      "https://madj.store",
      10,
    );

    expect(catalog.platform).toBe("tilda");
    expect(catalog.products[0]).toMatchObject({
      label: "Платье Luna",
      price: "18 900 ₽",
      imageUrl: "https://cdn.example.com/luna.jpg",
    });
  });
});

describe("parseHtmlCatalog", () => {
  it("parses embedded product blocks from homepage html", () => {
    const html = `
      'NAME':'Костюм "Champion"','DETAIL_PAGE_URL':'/catalog/kostyum-champion/'
      'NAME':'Костюм "Champion"','DETAIL_PAGE_URL':'/catalog/kostyum-champion/'
    `;

    const catalog = parseHtmlCatalog(html, "https://manekenbrand.com", 10);

    expect(catalog?.platform).toBe("html");
    expect(catalog?.products).toHaveLength(1);
    expect(catalog?.products[0].url).toBe(
      "https://manekenbrand.com/catalog/kostyum-champion/",
    );
  });
});
