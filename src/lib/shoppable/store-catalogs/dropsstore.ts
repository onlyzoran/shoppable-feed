import homeCatalog from "./dropsstore-home.json";
import type { StoreCatalog } from "./types";

export const DROPSSTORE_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
