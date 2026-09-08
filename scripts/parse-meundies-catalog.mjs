import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.meundies.com";
const outPath = join(root, "src/lib/shoppable/store-catalogs/meundies-home.json");

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/‑/g, "-");
}

function buildLabel(title) {
  return title
    .replace(/\s*[-|]\s*(Women's|Men's|Kids'|Unisex).*$/i, "")
    .replace(/\s+(Brief|Boxer Brief|Trunk|Thong|Bralette|Bra|Hipster|Cheeky|Boyshort|Short|Set|Pack)$/i, "")
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
    const response = await fetch(`${ORIGIN}/products.json?limit=250&page=${page}`, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch MeUndies catalog page ${page}: ${response.status}`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "MeUndies returned a non-JSON response (bot protection?). Try again from a local browser session.",
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
    tags.includes("hidden")
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
  "nude",
  "clear",
  "teal",
  "coral",
  "yellow",
]);

const GENERIC_STYLE_WORDS = new Set([
  "brief",
  "boxer brief",
  "trunk",
  "thong",
  "bralette",
  "bra",
  "hipster",
  "cheeky",
  "boyshort",
  "short",
  "set",
  "pack",
  "undies",
  "underwear",
]);

function productPriority(label) {
  const normalized = normalize(label);

  if (/collab|limited edition|member shop|exclusive/.test(normalized)) {
    return 12;
  }

  if (/print|collection|club|pack|set/.test(normalized)) {
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

  const aliasMap = {
    moonwalk: ["moonwalk", "moon walk"],
    "alien arcade": ["alien arcade"],
    "all over lace": ["all over lace", "all-over lace"],
    "jurassic park x meundies": [
      "jurassic park x meundies",
      "jurassic park",
      "meundies x jurassic park",
    ],
    "halloween collection": ["halloween collection", "the halloween collection"],
    "caught in your web": ["caught in your web"],
    "feelfree plunge bralette": [
      "feelfree plunge bralette",
      "plunge bralette",
      "plunge bralettes",
      "plunge + ruched bralettes",
      "plunge and ruched bralettes",
    ],
    "feelfree ruched bralette": [
      "feelfree ruched bralette",
      "ruched bralette",
      "ruched bralettes",
      "plunge + ruched bralettes",
      "plunge and ruched bralettes",
    ],
  };

  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (normalizedLabel.includes(key)) {
      for (const alias of aliases) {
        keywords.add(alias);
      }
    }
  }

  if (title.toLowerCase().includes("brief")) {
    keywords.add(`${label} brief`);
    keywords.add(normalize(`${label} brief`));
  }

  if (title.toLowerCase().includes("bralette")) {
    keywords.add(`${label} bralette`);
    keywords.add(normalize(`${label} bralette`));
  }

  return [...keywords]
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 3)
    .sort((left, right) => right.length - left.length);
}

function mergeCatalogEntry(existing, next) {
  existing.keywords = [...new Set([...existing.keywords, ...next.keywords])].sort(
    (left, right) => right.length - left.length,
  );

  if (next.price && !existing.price) {
    existing.price = next.price;
  }

  if (next.imageUrl && !existing.imageUrl) {
    existing.imageUrl = next.imageUrl;
  }
}

const shopifyProducts = await fetchAllProducts();
const productsByLabel = new Map();

for (const product of shopifyProducts) {
  if (shouldSkipProduct(product)) {
    continue;
  }

  const label = buildLabel(product.title);
  const entry = {
    id: slugify(label),
    label,
    url: `${ORIGIN}/products/${product.handle}`,
    keywords: extractKeywords(product.title, label),
    priority: productPriority(label),
    price: formatUsdPrice(product.variants?.[0]?.price),
    imageUrl: product.images?.[0]?.src ?? null,
    sourceTitle: product.title,
  };

  const existing = productsByLabel.get(normalize(label));
  if (existing) {
    mergeCatalogEntry(existing, entry);
    continue;
  }

  productsByLabel.set(normalize(label), entry);
}

const products = [...productsByLabel.values()]
  .map(({ sourceTitle: _sourceTitle, ...product }) => product)
  .sort(
    (left, right) =>
      right.priority - left.priority || left.label.localeCompare(right.label),
  );

writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      storeHostname: "meundies.com",
      source: ORIGIN,
      fetchedFrom: `${ORIGIN}/products.json?limit=250&page=*`,
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
