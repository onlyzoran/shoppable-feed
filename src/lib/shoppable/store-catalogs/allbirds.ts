import homeCatalog from "./allbirds-home.json";
import type { StoreCatalog } from "./types";

export const ALLBIRDS_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
