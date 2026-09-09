import type { CatalogProduct, ParsedCatalog } from "../types.js";
import {
  hostnameFromUrl,
  normalizeText,
  slugify,
  toAbsoluteUrl,
} from "./normalize.js";

function unescapeName(value: string): string {
  return value.replace(/\\'/g, "'");
}

function extractKeywords(name: string): string[] {
  const normalized = unescapeName(name)
    .toLowerCase()
    .replace(/[\u201c\u201d\u201e""„"]/g, '"');
  const keywords = new Set<string>();

  for (const match of normalized.matchAll(/"([^"]+)"/g)) {
    const quoted = match[1].trim();
    if (quoted.length >= 3) {
      keywords.add(quoted);
    }
  }

  const label = buildLabelFromName(name);
  if (label) {
    keywords.add(normalizeText(label));
  }

  return [...keywords].sort((left, right) => right.length - left.length);
}

function buildLabelFromName(name: string): string {
  const clean = unescapeName(name);
  const quoted = clean.match(/[\u201c"]([^\u201d"]+)[\u201d"]/)?.[1];
  if (quoted) {
    return quoted;
  }

  return clean.split("|")[0].trim();
}

export function parseHtmlCatalog(
  html: string,
  siteUrl: string,
  limit: number,
): ParsedCatalog | null {
  const origin = new URL(siteUrl);
  const products: CatalogProduct[] = [];
  const seenUrls = new Set<string>();

  for (const match of html.matchAll(
    /'NAME':'((?:\\'|[^'])*)','DETAIL_PAGE_URL':'([^']+)'/g,
  )) {
    if (products.length >= limit) {
      break;
    }

    const name = unescapeName(match[1]);
    const url = toAbsoluteUrl(origin, match[2]);
    if (seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    const keywords = extractKeywords(name);
    if (keywords.length === 0) {
      continue;
    }

    products.push({
      id: slugify(name),
      label: buildLabelFromName(name),
      url,
      keywords,
      priority: 10,
    });
  }

  if (products.length === 0) {
    for (const match of html.matchAll(
      /href="([^"]+\/products\/[^"#?]+)"[^>]*>([^<]{2,120})</gi,
    )) {
      if (products.length >= limit) {
        break;
      }

      const url = toAbsoluteUrl(origin, match[1]);
      const label = match[2].replace(/\s+/g, " ").trim();
      if (!label || seenUrls.has(url)) {
        continue;
      }

      seenUrls.add(url);
      products.push({
        id: slugify(label),
        label,
        url,
        keywords: [normalizeText(label)],
        priority: 5,
      });
    }
  }

  if (products.length === 0) {
    return null;
  }

  return {
    storeHostname: hostnameFromUrl(siteUrl),
    platform: "html",
    products,
  };
}
