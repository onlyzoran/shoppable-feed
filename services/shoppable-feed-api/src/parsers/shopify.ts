import { fetchJson } from "../http/fetch.js";
import type { CatalogProduct, ParsedCatalog } from "../types.js";
import {
  buildKeywordsFromTitle,
  buildLabelFromTitle,
  formatUsdPrice,
  hostnameFromUrl,
  slugify,
} from "./normalize.js";

type ShopifyProduct = {
  id: number | string;
  title: string;
  handle: string;
  variants?: Array<{ price?: string }>;
  images?: Array<{ src?: string }>;
};

type ShopifyProductsResponse = {
  products?: ShopifyProduct[];
};

export async function tryParseShopifyCatalog(
  siteUrl: string,
  limit: number,
): Promise<ParsedCatalog | null> {
  const origin = new URL(siteUrl);
  const probe = await fetchJson<ShopifyProductsResponse>(
    `${origin.origin}/products.json?limit=1`,
  ).catch(() => null);

  if (!probe?.products || !Array.isArray(probe.products)) {
    return null;
  }

  const products: CatalogProduct[] = [];
  const seenLabels = new Set<string>();

  for (let page = 1; products.length < limit && page <= 6; page += 1) {
    const payload = await fetchJson<ShopifyProductsResponse>(
      `${origin.origin}/products.json?limit=250&page=${page}`,
    );
    const batch = payload.products ?? [];
    if (batch.length === 0) {
      break;
    }

    for (const product of batch) {
      if (products.length >= limit) {
        break;
      }

      const title = product.title?.trim();
      const handle = product.handle?.trim();
      if (!title || !handle) {
        continue;
      }

      const label = buildLabelFromTitle(title);
      const dedupeKey = label.toLowerCase();
      if (seenLabels.has(dedupeKey)) {
        continue;
      }

      seenLabels.add(dedupeKey);
      const variant = product.variants?.[0];
      products.push({
        id: slugify(label),
        label,
        url: `${origin.origin}/products/${handle}`,
        keywords: buildKeywordsFromTitle(title, handle),
        priority: 10,
        price: variant?.price ? formatUsdPrice(variant.price) : undefined,
        imageUrl: product.images?.[0]?.src,
      });
    }
  }

  if (products.length === 0) {
    return null;
  }

  return {
    storeHostname: hostnameFromUrl(siteUrl),
    platform: "shopify",
    products,
  };
}
