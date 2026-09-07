import type { CatalogProduct, StoreCatalog } from "./store-catalogs/types";
import { listCatalogProducts } from "./store-catalogs";

export function matchCatalogProduct(
  caption: string,
  catalog: StoreCatalog,
): CatalogProduct | null {
  const normalized = caption.toLowerCase().replace(/\s+/g, " ");

  let best: { product: CatalogProduct; score: number } | null = null;

  for (const product of listCatalogProducts(catalog)) {
    for (const keyword of product.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, " ");
      if (!normalized.includes(normalizedKeyword)) {
        continue;
      }

      const score = normalizedKeyword.length + (product.priority ?? 0) * 100;
      if (!best || score > best.score) {
        best = { product, score };
      }
    }
  }

  return best?.product ?? null;
}
