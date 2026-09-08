import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.allbirds.com";
const outPath = join(
  root,
  "src/lib/shoppable/store-catalogs/allbirds-home.json",
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
    .replace(/^Men's |^Women's |^Smallbirds /, "")
    .replace(/\s*[-|]\s*.+$/, "")
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
        `Failed to fetch Allbirds catalog page ${page}: ${response.status}`,
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

function shouldSkipProduct(title, productType, tags) {
  const normalized = title.toLowerCase();
  const normalizedTags = (tags ?? []).map((tag) => tag.toLowerCase());

  return (
    normalized.includes("free returns") ||
    normalized.includes("gift card") ||
    normalized.includes("trino") ||
    /sock|sweatpant|sweatshirt|tee|t-shirt|beanie|hat|scarf|insole|insert|gift/i.test(
      normalized,
    ) ||
    normalizedTags.includes("hidden") ||
    normalizedTags.includes("exclude-from-search")
  );
}

const KEYWORD_ALIASES = {
  "Runner NZ Jersey": [
    "Varsity Jersey",
    "varsity jersey",
    "Jersey Collection",
    "jersey collection",
    "Runner NZ Jersey",
    "runner nz jersey",
  ],
  "Canvas Cruiser": [
    "Canvas Cruiser",
    "canvas cruiser",
    "Canvas Cruiser Collection",
    "canvas cruiser collection",
    "Pantone collection",
    "pantone collection",
  ],
  "Canvas Cruiser Slip On": [
    "Canvas Cruiser Slip On",
    "canvas cruiser slip on",
    "Cruiser Canvas Slip-On",
    "Cruiser Canvas Slip-Ons",
    "cruiser canvas slip-on",
    "cruiser canvas slip-ons",
  ],
  "Cruiser Slip On Canvas": [
    "Cruiser Slip On Canvas",
    "cruiser slip on canvas",
    "Cruiser Canvas Slip-On",
    "Cruiser Canvas Slip-Ons",
  ],
  "Breezer Point": ["Breezer Point", "breezer point"],
  "Varsity Airy": ["Varsity Airy", "varsity airy", "Varsity Airy's"],
  "Dasher NZ": ["Dasher NZ", "dasher nz"],
  Cruiser: ["Cruiser", "cruiser"],
  "Tree Runner NZ": ["Tree Runner NZ", "tree runner nz", "Tree Runner"],
  "Wool Runner NZ": ["Wool Runner NZ", "wool runner nz", "Wool Runner"],
  "Runner NZ Remix": ["Runner NZ", "runner nz", "Runner NZ Remix"],
  Varsity: ["Varsity", "varsity", "Varsity Collection"],
  Strider: ["Strider", "strider"],
  "Cruiser Terralux": ["Cruiser Terralux", "cruiser terralux", "Terralux"],
  "Tree Dasher 2": ["Tree Dasher", "tree dasher", "Tree Dasher 2"],
  "Lounger Lift": ["Lounger Lift", "lounger lift"],
  "Wool Runner-up Mizzles": [
    "Wool Runner-up Mizzles",
    "wool runner up mizzles",
    "Runner-up Mizzles",
  ],
  "Tree Runner Go": ["Tree Runner Go", "tree runner go"],
  "Plant Pacer": ["Plant Pacer", "plant pacer"],
};

function productPriority(label) {
  const normalized = normalize(label);

  if (/dasher|runner nz|cruiser|varsity|wool runner|tree runner/.test(normalized)) {
    return 12;
  }

  if (/strider|lounger|plant pacer|terralux/.test(normalized)) {
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

  const words = label.split(/\s+/).filter((word) => word.length >= 3);
  if (words.length >= 2) {
    keywords.add(words.slice(0, 2).join(" "));
    keywords.add(normalize(words.slice(0, 2).join(" ")));
  }

  return [...keywords]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .slice(0, 12);
}

const products = await fetchAllProducts();
const families = new Map();

for (const product of products) {
  if (shouldSkipProduct(product.title, product.product_type, product.tags)) {
    continue;
  }

  const label = buildLabel(product.title);
  if (!label || label.length < 3) {
    continue;
  }

  const existing = families.get(label);
  const variant = product.variants?.[0];
  const candidate = {
    label,
    handle: product.handle,
    price: variant?.price ? formatUsdPrice(variant.price) : null,
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
  storeHostname: "allbirds.com",
  source: ORIGIN,
  fetchedFrom: `${ORIGIN}/products.json?limit=250&page=*`,
  products: catalogProducts,
};

writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalogProducts.length} Allbirds products to ${outPath}`);
