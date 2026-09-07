export type CatalogProduct = {
  id: string;
  label: string;
  url: string;
  keywords: string[];
  /** Чем выше — тем приоритетнее при нескольких совпадениях */
  priority?: number;
};

export type StoreCatalog = {
  storeHostname: string;
  products: CatalogProduct[];
};
