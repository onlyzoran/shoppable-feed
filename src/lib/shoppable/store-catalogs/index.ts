import { ADAHLAZORGAN_CATALOG } from "./adahlazorgan";
import { BANANHOT_CATALOG } from "./bananhot";
import { DROPSSTORE_CATALOG } from "./dropsstore";
import { GREZ_CATALOG } from "./grez";
import { MADJ_CATALOG } from "./madj";
import { MANEKENBRAND_CATALOG } from "./manekenbrand";
import { WILDFLOWERCASES_CATALOG } from "./wildflowercases";
import type { StoreCatalog } from "./types";

export { ADAHLAZORGAN_CATALOG } from "./adahlazorgan";
export { BANANHOT_CATALOG } from "./bananhot";
export { DROPSSTORE_CATALOG } from "./dropsstore";
export { GREZ_CATALOG } from "./grez";
export { MADJ_CATALOG } from "./madj";
export { MANEKENBRAND_CATALOG } from "./manekenbrand";
export { WILDFLOWERCASES_CATALOG } from "./wildflowercases";
export type { CatalogProduct, StoreCatalog } from "./types";

const STORE_CATALOGS: StoreCatalog[] = [
  MANEKENBRAND_CATALOG,
  MADJ_CATALOG,
  DROPSSTORE_CATALOG,
  GREZ_CATALOG,
  BANANHOT_CATALOG,
  ADAHLAZORGAN_CATALOG,
  WILDFLOWERCASES_CATALOG,
];

export function getStoreCatalog(storeUrl: string): StoreCatalog | null {
  try {
    const hostname = new URL(storeUrl).hostname.replace(/^www\./, "");
    return (
      STORE_CATALOGS.find((catalog) => catalog.storeHostname === hostname) ??
      null
    );
  } catch {
    return null;
  }
}

export function listCatalogProducts(catalog: StoreCatalog) {
  return catalog.products;
}
