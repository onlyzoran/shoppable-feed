import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.brooklinen.com";
const outPath = join(
  root,
  "src/lib/shoppable/store-catalogs/brooklinen-home.json",
);

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/‑/g, "-");
}

function buildLabel(title) {
  return title
    .replace(/\s*[-|]\s*(Sheet Set|Duvet Cover|Pillowcase|Bundle|Insert).*$/i, "")
    .replace(/\s+(Set|Bundle|Insert|Cover|Pillowcases?)$/i, "")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(title) {
  return normalize(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function formatUsdPrice(value) {
  const amount = Number.parseFloat(String(value));
  if (!Number.isFinite(amount)) {
    return null;
  }

  if (Number.isInteger(amount)) {
    return `$${amount}`;
  }

  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

async function fetchAllProducts() {
  const products = [];

  for (let page = 1; page <= 12; page += 1) {
    const response = await fetch(`${ORIGIN}/products.json?limit=250&page=${page}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Brooklinen catalog page ${page}: ${response.status}`,
      );
    }

    const data = await response.json();
    const batch = data.products ?? [];
    if (batch.length === 0) {
      break;
    }

    products.push(...batch);
  }

  return products;
}

function shouldSkipProduct(product) {
  const title = product.title.toLowerCase();
  const tags = (product.tags ?? []).map((tag) => tag.toLowerCase());

  return (
    title.includes("gift card") ||
    tags.includes("gift-card") ||
    tags.includes("hidden") ||
    tags.includes("exclude-from-search")
  );
}

const GENERIC_COLOR_WORDS = new Set([
  "black",
  "white",
  "blue",
  "red",
  "pink",
  "green",
  "purple",
  "orange",
  "navy",
  "gold",
  "silver",
  "beige",
  "brown",
  "grey",
  "gray",
  "cream",
  "oak",
  "frost",
  "aegean",
  "pebble",
  "moss",
]);

const GENERIC_STYLE_WORDS = new Set([
  "sheet",
  "sheets",
  "set",
  "bundle",
  "cover",
  "pillow",
  "pillowcase",
  "duvet",
  "insert",
  "towel",
  "blanket",
]);

function productPriority(label) {
  const normalized = normalize(label);

  if (/bundle|hardcore|core/.test(normalized)) {
    return 12;
  }

  if (/classic|luxe|percale|sateen|waffle/.test(normalized)) {
    return 11;
  }

  return 10;
}

function extractKeywords(title, label) {
  const keywords = new Set();
  const normalizedLabel = normalize(label);

  keywords.add(label);
  keywords.add(normalizedLabel);

  for (const part of label.split("|").map((value) => value.trim())) {
    const normalizedPart = normalize(part);
    if (
      part.length >= 3 &&
      !GENERIC_COLOR_WORDS.has(normalizedPart) &&
      !GENERIC_STYLE_WORDS.has(normalizedPart)
    ) {
      keywords.add(part);
      keywords.add(normalizedPart);
    }
  }

  const words = label.split(/\s+/).filter((word) => word.length >= 3);
  if (words.length >= 2) {
    const twoWords = words.slice(0, 2).join(" ");
    const normalizedTwoWords = normalize(twoWords);
    if (!GENERIC_STYLE_WORDS.has(normalizedTwoWords)) {
      keywords.add(twoWords);
      keywords.add(normalizedTwoWords);
    }
  }

  if (title.toLowerCase().includes("sheet")) {
    keywords.add(`${label} sheets`);
    keywords.add(normalize(`${label} sheets`));
  }

  return [...keywords]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .slice(0, 12);
}

const products = await fetchAllProducts();
const catalogProducts = [];

for (const product of products) {
  if (shouldSkipProduct(product)) {
    continue;
  }

  const label = buildLabel(product.title);
  if (!label || label.length < 3) {
    continue;
  }

  const variant = product.variants?.[0];
  const price = variant?.price ? formatUsdPrice(variant.price) : null;
  const imageUrl = product.images?.[0]?.src ?? null;

  catalogProducts.push({
    id: slugify(label) || slugify(product.handle),
    label,
    url: `${ORIGIN}/products/${product.handle}`,
    keywords: extractKeywords(product.title, label),
    priority: productPriority(label),
    ...(price ? { price } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  });
}

const catalog = {
  storeHostname: "brooklinen.com",
  source: ORIGIN,
  fetchedFrom: `${ORIGIN}/products.json?limit=250&page=*`,
  products: catalogProducts,
};

writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalogProducts.length} Brooklinen products to ${outPath}`);
