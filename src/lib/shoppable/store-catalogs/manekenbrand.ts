import homeCatalog from "./manekenbrand-home.json";
import type { StoreCatalog } from "./types";

export const MANEKENBRAND_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
