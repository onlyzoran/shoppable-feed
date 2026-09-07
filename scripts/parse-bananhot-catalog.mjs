import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://bananhot.com";
const outPath = join(root, "src/lib/shoppable/store-catalogs/bananhot-home.json");
const limit = Number(process.argv[2] ?? 100);

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/‑/g, "-");
}

function buildLabel(title) {
  return title.split(" - ")[0].trim().replace(/\s+/g, " ");
}

function slugify(title) {
  return normalize(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

async function fetchAllProducts() {
  const products = [];

  for (let page = 1; page <= 6; page += 1) {
    const response = await fetch(`${ORIGIN}/products.json?limit=250&page=${page}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Bananhot catalog page ${page}: ${response.status}`);
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

function extractKeywords(title) {
  const keywords = new Set();
  const label = buildLabel(title);
  const normalizedLabel = normalize(label);
  const suffix = title.split(" - ").slice(1).join(" - ").trim();
  const genericSuffixes = new Set([
    "dress",
    "top",
    "bottom",
    "pants",
    "shorts",
    "skirt",
    "shirt",
    "scarf",
    "one piece",
    "mini dress",
    "maxi dress",
    "mini skirt",
    "maxi skirt",
    "highrise bottom",
    "bikini",
    "hat",
    "set",
  ]);

  keywords.add(label);
  keywords.add(normalizedLabel);
  keywords.add(label.replace(/-/g, " "));

  if (suffix) {
    keywords.add(`${label} ${suffix}`);
    keywords.add(normalize(`${label} ${suffix}`));

    const normalizedSuffix = normalize(suffix);
    if (!genericSuffixes.has(normalizedSuffix)) {
      keywords.add(suffix);
      keywords.add(normalizedSuffix);
    }
  }

  const words = label.split(/\s+/).filter((word) => word.length >= 3);
  if (words.length >= 2) {
    keywords.add(words.slice(0, 2).join(" "));
    keywords.add(normalize(words.slice(0, 2).join(" ")));
  }

  const aliasMap = {
    "brie beige": ["brie beige dress", "brie dress"],
    "nina scarlet": ["nina bikini set", "nina bikini", "nina scarlet red"],
    "nina white": ["nina bikini set", "nina bikini"],
    "nina peach": ["nina bikini set", "nina bikini"],
    "nina black": ["nina bikini set", "nina bikini"],
    "luna rockrose": ["luna bikini", "luna top", "luna bottom", "luna rockrose"],
    "liv deep ocean": ["liv bikini", "liv one piece"],
    "vecna": ["vecna lace dress", "vecna dress", "vecna lace"],
    "ivy purple": ["ivy purple bandana", "ivy shirt"],
    "noelle": ["noelle bikini"],
    "cidny": ["cidny bikini", "yellow cidny"],
    "africa": ["africa bikini"],
    "starfish": ["starfish bikini"],
    "danica macadamia": ["danica bikini"],
    "danica black": ["danica bikini"],
    "gala blue": ["gala blue matera bikini", "gala bikini"],
    "pracy": ["pracy bikini"],
    "kyma olive": ["kyma"],
    "kyma light": ["kyma"],
    "adelina olive": ["adelina set", "adelina"],
    "adelina rose": ["adelina set", "adelina"],
    "gaia olive": ["gaia in olive peridot", "gaia olive peridot", "gaia"],
    "gaia deep": ["gaia"],
    "bloom rose": ["bloom rose bikini"],
    "activewear": ["active wear"],
  };

  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (normalizedLabel.includes(key)) {
      for (const alias of aliases) {
        keywords.add(alias);
      }
    }
  }

  return [...keywords]
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 3)
    .sort((left, right) => right.length - left.length);
}

const shopifyProducts = await fetchAllProducts();
const products = shopifyProducts
  .map((product) => {
    const label = buildLabel(product.title);

    return {
      id: slugify(product.title),
      label,
      url: `${ORIGIN}/products/${product.handle}`,
      keywords: extractKeywords(product.title),
      priority: /dress|one piece|set/i.test(product.title) ? 11 : 10,
    };
  })
  .sort(
    (left, right) =>
      right.priority - left.priority || left.label.localeCompare(right.label),
  );

writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      storeHostname: "bananhot.com",
      source: ORIGIN,
      fetchedFrom: `${ORIGIN}/products.json?limit=250&page=*`,
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
