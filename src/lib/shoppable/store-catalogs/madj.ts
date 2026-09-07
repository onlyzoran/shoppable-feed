import homeCatalog from "./madj-home.json";
import type { StoreCatalog } from "./types";

export const MADJ_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
