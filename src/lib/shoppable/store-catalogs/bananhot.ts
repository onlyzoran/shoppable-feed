import homeCatalog from "./bananhot-home.json";
import type { StoreCatalog } from "./types";

export const BANANHOT_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
