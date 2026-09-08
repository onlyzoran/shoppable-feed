import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.wildflowercases.com";
const outPath = join(
  root,
  "src/lib/shoppable/store-catalogs/wildflowercases-home.json",
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
    .replace(
      /\s+(iPhone|Samsung Galaxy|Galaxy|AirPods(?: Max)?|iPad)\s+(Case|Cover)$/i,
      "",
    )
    .replace(/\s+Case$/i, "")
    .trim();
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

  for (let page = 1; page <= 6; page += 1) {
    const response = await fetch(
      `${ORIGIN}/products.json?limit=250&page=${page}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Wildflower catalog page ${page}: ${response.status}`,
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
    title.includes("mystery phone case") ||
    tags.includes("mystery") ||
    tags.includes("free")
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

function productPriority(label) {
  const normalized = normalize(label);

  if (
    /ahoy babe|squirrel friend|vanilla mace|daisy chain fields|sav hudson|frankies bikinis/.test(
      normalized,
    )
  ) {
    return 12;
  }

  if (/polka dot|collab|x /.test(normalized)) {
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
      !/^(polka dot|wildflower case)$/i.test(normalizedPart)
    ) {
      keywords.add(part);
      keywords.add(normalizedPart);
    }
  }

  const words = label.split(/\s+/).filter((word) => word.length >= 3);
  if (words.length >= 2) {
    const twoWords = words.slice(0, 2).join(" ");
    const normalizedTwoWords = normalize(twoWords);
    if (
      !["wildflower case", "wildflower gift", "wildflower sticker"].includes(
        normalizedTwoWords,
      )
    ) {
      keywords.add(twoWords);
      keywords.add(normalizedTwoWords);
    }
  }

  const aliasMap = {
    "ahoy babe": ["ahoy babe", "ahoy babe x wf", "ahoy babe collection"],
    "squirrel friend": [
      "squirrel friend",
      "squirrel friends",
      "squirrel friend release",
    ],
    "vanilla mace": [
      "vanilla mace",
      "vanilla mace x wildflower",
      "vanilla mace x wf",
      "vanilla mace collab",
    ],
    "polka dot | turquoise and black": [
      "polka dot turquoise and black",
      "turquoise and black polka dot",
      "turquoise & black polkadot",
      "turquoise and black polkadot",
      "polka dot turquoise",
    ],
    "daisy chain fields": [
      "daisy chain fields",
      "daisy chain feilds",
      "daisy chain fields collab",
      "olivia rodrigo",
      "daisychainfields",
    ],
    "sav hudson": ["sav hudson", "sav hudson peace sign", "peace sign"],
    "frankies bikinis bellissima": [
      "frankies bikinis",
      "frankies bikinis bellissima",
      "bellissima collab",
    ],
    "frankies bikinis rhinestone diva": [
      "frankies bikinis rhinestone diva",
      "rhinestone diva",
    ],
    "frankies bikinis malibu high": ["frankies bikinis malibu high", "malibu high"],
  };

  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (normalizedLabel.includes(key)) {
      for (const alias of aliases) {
        keywords.add(alias);
      }
    }
  }

  if (title.toLowerCase().includes("iphone case")) {
    keywords.add(`${label} iphone case`);
    keywords.add(normalize(`${label} iphone case`));
  }

  if (title.toLowerCase().includes("samsung galaxy case")) {
    keywords.add(`${label} samsung case`);
    keywords.add(normalize(`${label} samsung case`));
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

  if (/iphone case/i.test(next.sourceTitle) && !/iphone/i.test(existing.sourceTitle)) {
    existing.url = next.url;
    existing.price = next.price ?? existing.price;
    existing.imageUrl = next.imageUrl ?? existing.imageUrl;
    existing.sourceTitle = next.sourceTitle;
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
      storeHostname: "wildflowercases.com",
      source: ORIGIN,
      fetchedFrom: `${ORIGIN}/products.json?limit=250&page=*`,
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
