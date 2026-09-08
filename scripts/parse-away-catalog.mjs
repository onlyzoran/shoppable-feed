import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.awaytravel.com";
const outPath = join(
  root,
  "src/lib/shoppable/store-catalogs/awaytravel-home.json",
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
    .split(" in ")[0]
    .replace(/\s+\([^)]+\)$/, "")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(label) {
  return normalize(label)
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
        `Failed to fetch Away catalog page ${page}: ${response.status}`,
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

function shouldSkipProduct(title, productType, tags, price) {
  const normalized = title.toLowerCase();
  const normalizedTags = (tags ?? []).map((tag) => tag.toLowerCase());
  const amount = Number.parseFloat(String(price ?? ""));

  return (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    normalized.includes("gift card") ||
    normalized.includes("diy kit") ||
    normalized.includes("replacement") ||
    /collegiate|match day|monogram only|warranty|lock set|repair kit/i.test(
      normalized,
    ) ||
    productType?.toLowerCase() === "parts" ||
    normalizedTags.includes("seo.hidden") ||
    normalizedTags.includes("hidden")
  );
}

const KEYWORD_ALIASES = {
  "The Bigger Carry-On": [
    "The Bigger Carry-On",
    "Bigger Carry-On",
    "bigger carry-on",
    "Bigger Carry On",
  ],
  "The Carry-On": [
    "The Carry-On",
    "Carry-On",
    "carry-on",
    "Carry On",
    "Away carry-on",
  ],
  "The Medium Flex": ["The Medium Flex", "Medium Flex", "medium flex"],
  "The Large Flex": ["The Large Flex", "Large Flex", "large flex"],
  "The Bigger Carry-On Flex": [
    "Bigger Carry-On Flex",
    "bigger carry-on flex",
    "Carry-On Flex",
  ],
  "The Carry-On Flex": ["Carry-On Flex", "carry-on flex"],
  "Topside Bigger Carry-On": [
    "Topside Bigger Carry-On",
    "topside bigger carry-on",
    "Topside",
    "Topside collection",
    "topside collection",
    "Topside in Cherry Red",
  ],
  "Topside Carry-On": [
    "Topside Carry-On",
    "topside carry-on",
    "Topside collection",
    "topside collection",
    "Topside in Cherry Red",
  ],
  "Topside Medium Trunk": [
    "Topside Medium Trunk",
    "topside medium trunk",
    "Topside collection",
    "topside collection",
  ],
  "The Everywhere Bag": [
    "The Everywhere Bag",
    "Everywhere Bag",
    "everywhere bag",
  ],
  "The Commuter Backpack": [
    "The Commuter Backpack",
    "Commuter Backpack",
    "commuter backpack",
  ],
  "Featherlight Weekender": [
    "Featherlight Weekender",
    "featherlight weekender",
    "Featherlight Collection",
    "featherlight collection",
  ],
  "Featherlight Backpack": [
    "Featherlight Backpack",
    "featherlight backpack",
    "Featherlight Collection",
    "featherlight collection",
  ],
  "Insider Packing Cubes (Set of 4)": [
    "Insider Packing Cubes",
    "insider packing cubes",
    "Packing Cubes",
    "packing cubes",
  ],
  "Compression Packing Cubes": [
    "Compression Packing Cubes",
    "compression packing cubes",
  ],
  "The Medium": ["The Medium", "Medium suitcase", "medium suitcase"],
  "The Large": ["The Large", "Large suitcase", "large suitcase"],
  "Stadium Bag": ["Stadium Bag", "stadium bag"],
  "Softside Garment Roller": [
    "Softside Garment Roller",
    "softside garment roller",
    "Garment Roller",
    "garment roller",
  ],
  "Riviera Straw Tote": [
    "Riviera Straw Tote",
    "riviera straw tote",
    "Cabana Collection",
    "cabana collection",
    "Cabana",
  ],
  "Mini Riviera Straw Tote": [
    "Mini Riviera Straw Tote",
    "mini riviera straw tote",
    "Cabana Collection",
    "cabana collection",
    "Cabana",
  ],
  "Tween Travel Bundle": [
    "Tween Travel Bundle",
    "tween travel bundle",
    "In Between Collection",
    "in between collection",
    "The In Between Collection",
  ],
};

function productPriority(label) {
  const normalized = normalize(label);

  if (/bigger carry-on|carry-on|medium flex|large flex|topside|everywhere bag|commuter backpack/.test(normalized)) {
    return 12;
  }

  if (/weekender|packing cube|stadium bag|large|medium|trunk/.test(normalized)) {
    return 11;
  }

  return 10;
}

function extractKeywords(label) {
  const keywords = new Set([label, normalize(label)]);

  for (const alias of KEYWORD_ALIASES[label] ?? []) {
    keywords.add(alias);
    keywords.add(normalize(alias));
  }

  const withoutThe = label.replace(/^The /, "");
  if (withoutThe !== label) {
    keywords.add(withoutThe);
    keywords.add(normalize(withoutThe));
  }

  return [...keywords]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .slice(0, 12);
}

const products = await fetchAllProducts();
const families = new Map();

for (const product of products) {
  const variant = product.variants?.[0];
  const price = variant?.price ?? null;

  if (shouldSkipProduct(product.title, product.product_type, product.tags, price)) {
    continue;
  }

  const label = buildLabel(product.title);
  if (!label || label.length < 3) {
    continue;
  }

  const existing = families.get(label);
  const candidate = {
    label,
    handle: product.handle,
    price: price ? formatUsdPrice(price) : null,
    imageUrl: product.images?.[0]?.src ?? null,
    priority: productPriority(label),
  };

  if (!existing || (candidate.imageUrl && !existing.imageUrl)) {
    families.set(label, candidate);
  }
}

const catalogProducts = [...families.values()]
  .sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label))
  .map((entry) => ({
    id: slugify(entry.label),
    label: entry.label,
    url: `${ORIGIN}/products/${entry.handle}`,
    keywords: extractKeywords(entry.label),
    priority: entry.priority,
    ...(entry.price ? { price: entry.price } : {}),
    ...(entry.imageUrl ? { imageUrl: entry.imageUrl } : {}),
  }));

const catalog = {
  storeHostname: "awaytravel.com",
  source: ORIGIN,
  fetchedFrom: `${ORIGIN}/products.json?limit=250&page=*`,
  products: catalogProducts,
};

writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalogProducts.length} Away products to ${outPath}`);
