import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath =
  process.argv[2] ??
  join(root, "src/lib/shoppable/store-catalogs/madj-home.json");

const API_URL =
  "https://store.tildaapi.com/api/getproductslist/?storepartuid=606657650631&recid=564342696&c=6845764&size=100";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function buildKeywords(title) {
  const normalized = title.trim().toLowerCase();
  const keywords = new Set([normalized]);

  if (normalized.includes("-")) {
    keywords.add(normalized.replace(/-/g, " "));
  }

  return [...keywords].sort((left, right) => right.length - left.length);
}

function buildLabel(title) {
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("платье ")) {
    return trimmed;
  }
  if (lower.startsWith("юбка ")) {
    return trimmed;
  }
  if (lower.startsWith("джемпер")) {
    return trimmed;
  }

  return trimmed;
}

const response = await fetch(API_URL, {
  headers: { "User-Agent": "Mozilla/5.0 (compatible; ShoppableFeedBot/1.0)" },
});

if (!response.ok) {
  throw new Error(`Tilda API returned ${response.status}`);
}

const payload = await response.json();
const seenTitles = new Set();
const products = [];

for (const item of payload.products ?? []) {
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
    label: buildLabel(title),
    url,
    keywords: buildKeywords(title),
    priority: 10,
  });
}

writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      storeHostname: "madj.store",
      source: "https://madj.store",
      fetchedFrom: "store.tildaapi.com",
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
