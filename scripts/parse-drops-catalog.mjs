import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath =
  process.argv[2] ??
  join(root, "src/lib/shoppable/store-catalogs/dropsstore-home.json");
const productsCachePath =
  process.argv[3] ?? join(root, "mock-data/drops-products.json");

const CONFIG = {
  storeHostname: "dropsstore.ru",
  source: "https://www.dropsstore.ru",
  apiUrl:
    "https://store.tildaapi.com/api/getproductslist/?storepartuid=474224133802&recid=785208032&c=8485399&size=100",
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function slugFromUrl(url) {
  const match = url.match(/tproduct\/[^-]+-[^-]+-(.+)$/);
  return match?.[1]?.replace(/-/g, " ") ?? "";
}

function buildKeywords(title, url) {
  const normalized = title.trim().toLowerCase();
  const keywords = new Set([normalized]);

  if (normalized.includes("-")) {
    keywords.add(normalized.replace(/-/g, " "));
  }

  const urlSlug = slugFromUrl(url);
  if (urlSlug.length >= 4) {
    keywords.add(urlSlug);
  }

  return [...keywords].sort((left, right) => right.length - left.length);
}

async function loadProducts() {
  try {
    const cached = JSON.parse(readFileSync(productsCachePath, "utf8"));
    if (cached.products?.length) {
      return cached.products;
    }
  } catch {
    // fetch below
  }

  const response = await fetch(CONFIG.apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ShoppableFeedBot/1.0)" },
  });

  if (!response.ok) {
    throw new Error(`Tilda API returned ${response.status}`);
  }

  const payload = await response.json();
  writeFileSync(productsCachePath, `${JSON.stringify(payload, null, 2)}\n`);
  return payload.products ?? [];
}

const seenTitles = new Set();
const products = [];

for (const item of await loadProducts()) {
  const title = item.title?.trim();
  const url = item.url?.trim();

  if (!title || !url) {
    continue;
  }

  const dedupeKey = title.toLowerCase();
  if (seenTitles.has(dedupeKey)) {
    continue;
  }

  seenTitles.add(dedupeKey);
  products.push({
    id: slugify(title),
    label: title,
    url,
    keywords: buildKeywords(title, url),
    priority: 10,
  });
}

writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      storeHostname: CONFIG.storeHostname,
      source: CONFIG.source,
      fetchedFrom: "store.tildaapi.com",
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
