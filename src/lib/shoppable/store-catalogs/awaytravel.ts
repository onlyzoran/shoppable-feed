import homeCatalog from "./awaytravel-home.json";
import type { StoreCatalog } from "./types";

export const AWAYTRAVEL_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
