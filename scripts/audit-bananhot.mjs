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

function isRealPermalink(link) {
  return link?.includes("instagram.com/p/") || link?.includes("instagram.com/reel/");
}

const payload = JSON.parse(
  readFileSync(join(root, "mock-data/bananhot.json"), "utf8"),
);
const catalog = JSON.parse(
  readFileSync(join(catalogsDir, "bananhot-home.json"), "utf8"),
);
const posts = payload.payload ?? [];

console.log("=== BANANHOT MOCK DATA ===");
console.log(`Posts: ${posts.length}`);

const authors = [...new Set(posts.map((post) => post.author?.username).filter(Boolean))];
console.log(`Authors: ${authors.join(", ")}`);

const typeCounts = posts.reduce((acc, post) => {
  const type = post.type ?? "unknown";
  acc[type] = (acc[type] ?? 0) + 1;
  return acc;
}, {});
console.log("Types:", typeCounts);

const badLinks = posts.filter((post) => !isRealPermalink(post.link));
const noMedia = posts.filter(
  (post) => !(post.media?.[0]?.thumbnail?.url || post.media?.[0]?.url),
);
const emptyCaptions = posts.filter((post) => !post.caption?.trim());

console.log(`Bad links: ${badLinks.length}`);
console.log(`No media: ${noMedia.length}`);
console.log(`Empty captions: ${emptyCaptions.length}`);

console.log("\n=== BANANHOT CATALOG ===");
console.log(`Products: ${catalog.products.length}`);
const noPrice = catalog.products.filter((product) => !product.price);
const noImage = catalog.products.filter((product) => !product.imageUrl);
console.log(`Missing price: ${noPrice.length}`);
console.log(`Missing image: ${noImage.length}`);
if (noPrice.length > 0) {
  console.log("  No price:", noPrice.map((product) => product.label).join(", "));
}
if (noImage.length > 0) {
  console.log("  No image:", noImage.map((product) => product.label).join(", "));
}

console.log("\n=== POST → PRODUCT MATCHES ===");
const matchedPosts = [];
const unmatchedPosts = [];

for (const post of posts) {
  const caption = post.caption ?? "";
  const match = matchCatalogProduct(caption, catalog);

  if (match) {
    matchedPosts.push({
      link: post.link,
      caption: caption.replace(/\s+/g, " ").trim(),
      product: match.product.label,
      keyword: match.keyword,
      price: match.product.price ?? "(no price)",
      image: match.product.imageUrl ? "yes" : "no",
    });
  } else {
    unmatchedPosts.push({
      link: post.link,
      caption: caption.replace(/\s+/g, " ").trim() || "(empty)",
    });
  }
}

console.log(`Matched: ${matchedPosts.length}/${posts.length}`);
console.log(`Unmatched: ${unmatchedPosts.length}/${posts.length}`);

const byProduct = new Map();
for (const entry of matchedPosts) {
  const existing = byProduct.get(entry.product) ?? {
    posts: 0,
    price: entry.price,
    image: entry.image,
  };
  existing.posts += 1;
  byProduct.set(entry.product, existing);
}

console.log("\nProducts on posts:");
for (const [label, info] of [...byProduct.entries()].sort(
  (left, right) => right[1].posts - left[1].posts,
)) {
  console.log(
    `  - ${label}: ${info.posts} posts, ${info.price}, image ${info.image}`,
  );
}

console.log("\nMatched post samples:");
for (const entry of matchedPosts.slice(0, 10)) {
  console.log(`  [${entry.product}] ${entry.caption.slice(0, 72)}`);
}

console.log("\nUnmatched post samples:");
for (const entry of unmatchedPosts.slice(0, 12)) {
  console.log(`  - ${entry.caption.slice(0, 90)}`);
}

console.log("\n=== FEED PREVIEW (first 12 posts) ===");
for (const post of posts.slice(0, 12)) {
  const caption = (post.caption ?? "").replace(/\s+/g, " ").trim();
  const match = matchCatalogProduct(caption, catalog);
  console.log("---");
  console.log(caption.slice(0, 85) || "(empty)");
  console.log(
    match
      ? `→ ${match.product.label} | ${match.product.price ?? "no price"} | image ${match.product.imageUrl ? "yes" : "no"}`
      : "→ no product match",
  );
}
