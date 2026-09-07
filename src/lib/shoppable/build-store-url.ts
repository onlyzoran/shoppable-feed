export function buildStoreProductSearchUrl(
  storeUrl: string,
  query: string,
): string {
  const parsed = new URL(storeUrl);

  if (parsed.hostname.replace(/^www\./, "") === "manekenbrand.com") {
    const search = new URL(`${parsed.origin}/catalog/`);
    search.searchParams.set("q", query);
    return search.toString();
  }

  const pathname = parsed.pathname.replace(/\/$/, "");
  const searchBase = pathname ? `${parsed.origin}${pathname}` : parsed.origin;

  const search = new URL(`${searchBase}/search`);
  search.searchParams.set("q", query);
  search.searchParams.set("type", "product");

  return search.toString();
}
