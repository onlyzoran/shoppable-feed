import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://adahlazorgan.com";
const outPath = join(
  root,
  "src/lib/shoppable/store-catalogs/adahlazorgan-home.json",
);

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

  for (let page = 1; page <= 4; page += 1) {
    const response = await fetch(`${ORIGIN}/products.json?limit=250&page=${page}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Adah Lazorgan catalog page ${page}: ${response.status}`,
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

function extractKeywords(title) {
  const keywords = new Set();
  const label = buildLabel(title);
  const normalizedLabel = normalize(label);
  const suffix = title.split(" - ").slice(1).join(" - ").trim();
  const genericSuffixes = new Set([
    "palette",
    "pen",
    "stick",
    "mask",
    "serum",
    "cleanser",
    "cream",
    "gloss",
    "sponge",
    "brush",
    "mascara",
    "liner",
    "pencil",
    "powder",
    "tint",
    "drops",
    "shimmer",
    "corrector",
    "concealer",
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
    "blush stick": ["blush stick", "blushstick", "blush sticks"],
    "brow wax": ["brow wax", "adah brow wax", "adah's brow wax"],
    "brow pen": ["brow pen", "eyebrow pen"],
    "glow stick": ["glow stick"],
    "contour stick": ["contour stick"],
    "sassy lips": ["sassy lips", "lip oil"],
    "lip stick pen": ["lipstick pen", "lipstick pen by adah"],
    "4k foundation": ["4k foundation", "foundation 4k"],
    "silk4k foundation": ["silk4k foundation", "silk foundation"],
    "freckles pen": ["freckles pen"],
    "under eye pen": ["under eye pen", "under-eye pen"],
    "shine shine bronzing drops": ["bronzing drops"],
    "shine shine shimmer": ["shine shimmer", "perfect shimmer"],
    "vitamin c serum": ["vitamin c serum", "vit c serum"],
    "vitamin c cleanser": ["vitamin c cleanser"],
    "luminous cream": ["luminous cream"],
    "sleeping beautylips mask": [
      "sleeping beautylips mask",
      "sleeping lips mask",
      "lips mask",
    ],
    "lip & cheek tint": ["lip and cheek tint", "lip cheek tint"],
    "love your cheeks palette": ["love your cheeks"],
    "adah's night palette": ["night palette", "adahs night palette"],
    "fanta palette": ["fanta palette", "dark solution palette"],
    "xoxo gloss": ["xoxo gloss", "lip gloss xoxo"],
    "gel eyeliner": ["gel eyeliner", "eyeliner"],
    "renee mascara": ["renee mascara", "mascara"],
    "mineral loose powder blush": ["powder blush", "pigmented blushes"],
    "lip liner": ["lip liner"],
  };

  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (normalizedLabel.includes(key)) {
      for (const alias of aliases) {
        keywords.add(alias);
      }
    }
  }

  if (/^brush no\.?\d+/i.test(label)) {
    keywords.add("makeup brush");
  }

  if (/^adah eyelashes/i.test(label)) {
    keywords.add("eyelashes");
    keywords.add("lashes");
  }

  return [...keywords]
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 3)
    .sort((left, right) => right.length - left.length);
}

function productPriority(title, productType) {
  const normalized = title.toLowerCase();

  if (/foundation|concealer|corrector|blush stick|brow wax|glow stick|contour stick/.test(normalized)) {
    return 12;
  }

  if (/palette|serum|cleanser|mask|cream/.test(normalized) || productType === "SKINCARE") {
    return 11;
  }

  return 10;
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
      priority: productPriority(product.title, product.product_type),
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
      storeHostname: "adahlazorgan.com",
      source: ORIGIN,
      fetchedFrom: `${ORIGIN}/products.json?limit=250&page=*`,
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
