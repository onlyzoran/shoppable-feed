import homeCatalog from "./grez-home.json";
import type { StoreCatalog } from "./types";

export const GREZ_CATALOG: StoreCatalog = {
  storeHostname: homeCatalog.storeHostname,
  products: homeCatalog.products,
};
