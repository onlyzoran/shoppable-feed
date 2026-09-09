import { fetchJson } from "../http/fetch.js";
import type { CatalogProduct, ParsedCatalog } from "../types.js";
import {
  buildKeywordsFromTitle,
  extractTildaImageUrl,
  formatTildaPrice,
  hostnameFromUrl,
  slugify,
  toAbsoluteUrl,
} from "./normalize.js";

type TildaProduct = {
  title?: string;
  url?: string;
  price?: string | number;
  editions?: Array<{ price?: string | number; img?: string }>;
  gallery?: string;
};

type TildaProductsResponse = {
  products?: TildaProduct[];
};

const TILDA_API_PATTERN =
  /https:\/\/store\.tildaapi\.com\/api\/getproductslist\/\?[^"'\\]+/i;

export function extractTildaApiUrl(html: string): string | null {
  const match = html.match(TILDA_API_PATTERN);
  if (!match) {
    return null;
  }

  return match[0]
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/\\"/g, "");
}

export async function parseTildaCatalog(
  apiUrl: string,
  siteUrl: string,
  limit: number,
): Promise<ParsedCatalog> {
  const origin = new URL(siteUrl);
  const payload = await fetchJson<TildaProductsResponse>(apiUrl);
  const seenTitles = new Set<string>();
  const products: CatalogProduct[] = [];

  for (const item of payload.products ?? []) {
    if (products.length >= limit) {
      break;
    }

    const title = item.title?.trim();
    const url = item.url?.trim();
    if (!title || !url) {
      continue;
    }

    const dedupeKey = title.toLowerCase();
    if (seenTitles.has(dedupeKey)) {
      continue;
    }

    seenTitles.add(dedupeKey);
    products.push({
      id: slugify(title),
      label: title,
      url: toAbsoluteUrl(origin, url),
      keywords: buildKeywordsFromTitle(title),
      priority: 10,
      price: formatTildaPrice(item),
      imageUrl: extractTildaImageUrl(item),
    });
  }

  if (products.length === 0) {
    throw new Error("Tilda store returned no products");
  }

  return {
    storeHostname: hostnameFromUrl(siteUrl),
    platform: "tilda",
    products,
  };
}
