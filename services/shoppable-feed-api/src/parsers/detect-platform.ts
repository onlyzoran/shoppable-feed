import { fetchText } from "../http/fetch.js";
import type { JobStage, ParsedCatalog } from "../types.js";
import { normalizeOrigin } from "./normalize.js";
import { parseHtmlCatalog } from "./html.js";
import { tryParseShopifyCatalog } from "./shopify.js";
import { extractTildaApiUrl, parseTildaCatalog } from "./tilda.js";

export async function parseCatalogFromUrl(
  siteUrl: string,
  limit: number,
  onStage: (stage: JobStage) => void,
): Promise<ParsedCatalog> {
  const origin = normalizeOrigin(siteUrl).origin;

  onStage("detecting");
  const shopifyCatalog = await tryParseShopifyCatalog(origin, limit);
  if (shopifyCatalog) {
    return shopifyCatalog;
  }

  onStage("fetching");
  const html = await fetchText(`${origin}/`);

  const tildaApiUrl = extractTildaApiUrl(html);
  if (tildaApiUrl) {
    onStage("normalizing");
    return parseTildaCatalog(tildaApiUrl, origin, limit);
  }

  onStage("normalizing");
  const htmlCatalog = parseHtmlCatalog(html, origin, limit);
  if (htmlCatalog) {
    return htmlCatalog;
  }

  throw new Error("Could not detect a product catalog on this site");
}
