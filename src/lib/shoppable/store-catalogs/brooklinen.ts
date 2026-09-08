import homeCatalog from "./brooklinen-home.json";
import type { StoreCatalog } from "./types";

export const BROOKLINEN_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
