import homeCatalog from "./meundies-home.json";
import type { StoreCatalog } from "./types";

export const MEUNDIES_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
