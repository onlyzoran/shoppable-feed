import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogsDir = join(root, "src/lib/shoppable/store-catalogs");

function normalizeCaption(text) {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function captionIncludesKeyword(caption, keyword) {
  const escaped = keyword
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");

  return new RegExp(
    `(?:^|\\s|[^a-z0-9а-яё])${escaped}(?:\\s|[^a-z0-9а-яё]|$)`,
    "i",
  ).test(` ${caption} `);
}

function matchCatalogProduct(caption, catalog) {
  const normalized = normalizeCaption(caption);
  let best = null;

  for (const product of catalog.products) {
    for (const keyword of product.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, " ");
      if (!captionIncludesKeyword(normalized, normalizedKeyword)) {
        continue;
      }

      const score = normalizedKeyword.length + (product.priority ?? 0) * 100;
      if (!best || score > best.score) {
        best = { product, score, keyword: normalizedKeyword };
      }
    }
  }

  return best;
}

const payload = JSON.parse(
  readFileSync(join(root, "mock-data/adahlazorgan.json"), "utf8"),
);
const catalog = JSON.parse(
  readFileSync(join(catalogsDir, "adahlazorgan-home.json"), "utf8"),
);
const posts = payload.payload ?? [];

console.log("=== ADAH MOCK DATA ===");
console.log(`Posts: ${posts.length}`);
console.log(
  `Authors: ${[...new Set(posts.map((post) => post.author?.username).filter(Boolean))].join(", ")}`,
);

const matchedPosts = [];
const unmatchedPosts = [];

for (const post of posts) {
  const caption = post.caption ?? "";
  const match = matchCatalogProduct(caption, catalog);

  if (match) {
    matchedPosts.push({
      caption: caption.replace(/\s+/g, " ").trim().slice(0, 85),
      product: match.product.label,
      price: match.product.price ?? "(no price)",
    });
  } else {
    unmatchedPosts.push(caption.replace(/\s+/g, " ").trim().slice(0, 90));
  }
}

console.log(`\nMatched: ${matchedPosts.length}/${posts.length}`);
for (const entry of matchedPosts) {
  console.log(`  [${entry.product}] ${entry.price} — ${entry.caption}`);
}

console.log(`\nUnmatched (${unmatchedPosts.length}):`);
for (const caption of unmatchedPosts.slice(0, 10)) {
  console.log(`  - ${caption}`);
}

console.log("\n=== FEED PREVIEW (first 12) ===");
for (const post of posts.slice(0, 12)) {
  const caption = (post.caption ?? "").replace(/\s+/g, " ").trim();
  const match = matchCatalogProduct(caption, catalog);
  console.log("---");
  console.log(caption.slice(0, 85) || "(empty)");
  console.log(
    match
      ? `→ ${match.product.label} | ${match.product.price ?? "no price"}`
      : "→ no product match",
  );
}
