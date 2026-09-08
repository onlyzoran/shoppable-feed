import type { CatalogProduct, StoreCatalog } from "./store-catalogs/types";
import { listCatalogProducts } from "./store-catalogs";
import { MAX_PRODUCT_BUTTONS } from "./types";

const STOP_WORDS = new Set([
  "в",
  "из",
  "на",
  "с",
  "и",
  "the",
  "a",
  "an",
  "of",
  "for",
]);

function significantWords(keyword: string): string[] {
  return keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function captionIncludesFlexiblePhrase(
  caption: string,
  keyword: string,
  maxGap = 24,
): boolean {
  const words = significantWords(keyword);
  if (words.length < 2) {
    return false;
  }

  let previousEnd = 0;
  for (const word of words) {
    const index = caption.indexOf(word, previousEnd);
    if (index === -1) {
      return false;
    }

    if (previousEnd > 0 && index - previousEnd > maxGap) {
      return false;
    }

    previousEnd = index + word.length;
  }

  return true;
}

function captionIncludesKeyword(caption: string, keyword: string): boolean {
  const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, " ");

  const escaped = normalizedKeyword
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");

  if (
    new RegExp(
      `(?:^|\\s|[^a-z0-9а-яё])${escaped}(?:\\s|[^a-z0-9а-яё]|$)`,
      "i",
    ).test(` ${caption} `)
  ) {
    return true;
  }

  return captionIncludesFlexiblePhrase(caption, normalizedKeyword);
}

function scoreKeywordMatch(keyword: string, product: CatalogProduct): number {
  return keyword.length + (product.priority ?? 0) * 100;
}

function findKeywordPosition(caption: string, keyword: string): number {
  const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, " ");
  const directIndex = caption.indexOf(normalizedKeyword);
  if (directIndex >= 0) {
    return directIndex;
  }

  const words = significantWords(normalizedKeyword);
  if (words.length >= 2) {
    return caption.indexOf(words[0]);
  }

  return Number.POSITIVE_INFINITY;
}

function collectCatalogMatches(caption: string, catalog: StoreCatalog) {
  const normalized = caption.toLowerCase().replace(/\s+/g, " ");
  const matches: {
    product: CatalogProduct;
    score: number;
    position: number;
  }[] = [];

  for (const product of listCatalogProducts(catalog)) {
    let bestScore = 0;
    let bestPosition = Number.POSITIVE_INFINITY;

    for (const keyword of product.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, " ");
      if (!captionIncludesKeyword(normalized, normalizedKeyword)) {
        continue;
      }

      const score = scoreKeywordMatch(normalizedKeyword, product);
      const position = findKeywordPosition(normalized, normalizedKeyword);
      if (score > bestScore) {
        bestScore = score;
        bestPosition = position;
      }
    }

    if (bestScore > 0) {
      matches.push({ product, score: bestScore, position: bestPosition });
    }
  }

  return matches;
}

export function matchCatalogProduct(
  caption: string,
  catalog: StoreCatalog,
): CatalogProduct | null {
  const matches = collectCatalogMatches(caption, catalog);
  if (matches.length === 0) {
    return null;
  }

  matches.sort((left, right) => right.score - left.score);
  return matches[0]?.product ?? null;
}

export function matchCatalogProducts(
  caption: string,
  catalog: StoreCatalog,
  limit = MAX_PRODUCT_BUTTONS,
): CatalogProduct[] {
  const matches = collectCatalogMatches(caption, catalog);
  if (matches.length === 0) {
    return [];
  }

  matches.sort(
    (left, right) =>
      left.position - right.position || right.score - left.score,
  );

  const seenIds = new Set<string>();
  const products: CatalogProduct[] = [];

  for (const match of matches) {
    if (seenIds.has(match.product.id)) {
      continue;
    }

    seenIds.add(match.product.id);
    products.push(match.product);
    if (products.length >= limit) {
      break;
    }
  }

  return products;
}
