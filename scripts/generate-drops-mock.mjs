import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsPath =
  process.argv[2] ?? join(root, "mock-data/drops-products.json");
const outPath =
  process.argv[3] ?? join(root, "mock-data/dropsstore.json");

const products = JSON.parse(readFileSync(productsPath, "utf8")).products ?? [];
const seenTitles = new Set();
const uniqueProducts = [];

for (const product of products) {
  const key = product.title.trim().toLowerCase();
  if (seenTitles.has(key)) {
    continue;
  }
  seenTitles.add(key);
  uniqueProducts.push(product);
}

const genericPosts = [
  {
    caption:
      "Новый дроп DROP'S уже скоро. Лимитированная партия — успей забрать на dropsstore.ru",
    image: uniqueProducts[0]?.gallery
      ? JSON.parse(uniqueProducts[0].gallery)[0]?.img
      : null,
  },
  {
    caption: "Cruise collection — комфорт и сочетаемость на каждый день.",
    image: uniqueProducts[1]?.gallery
      ? JSON.parse(uniqueProducts[1].gallery)[0]?.img
      : null,
  },
];

function vendorId(seed) {
  return createHash("sha1").update(seed).digest("hex");
}

function shortcode(index) {
  return `DropsMock${String(index).padStart(2, "0")}`;
}

function buildPost(index, caption, imageUrl, type = "image") {
  const code = shortcode(index);

  return {
    vendorId: vendorId(code),
    type: type === "video" ? "reel" : "image",
    link: `https://www.instagram.com/p/${code}/`,
    publishedAt: new Date(Date.UTC(2026, 8, 7 - index, 12, 0, 0)).toISOString(),
    author: {
      username: "dropsstore.ru",
      profilePictureUrl: "",
      isVerifiedProfile: false,
      name: "DROP'S",
      biography: null,
    },
    media: [{ type: "image", thumbnail: { url: imageUrl } }],
    caption,
    commentsCount: 8 + index,
    likesCount: 120 + index * 11,
    shareCount: null,
  };
}

const payload = [];

uniqueProducts.slice(0, 12).forEach((product, index) => {
  const image = JSON.parse(product.gallery)[0]?.img;
  if (!image) {
    return;
  }

  const snippet = product.text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  payload.push(
    buildPost(
      index + 1,
      `${product.title} — ${snippet}${snippet.length >= 100 ? "…" : ""}`,
      image,
    ),
  );
});

genericPosts.forEach((post) => {
  if (!post.image) {
    return;
  }

  payload.push(buildPost(payload.length + 1, post.caption, post.image));
});

writeFileSync(outPath, `${JSON.stringify({ payload }, null, 4)}\n`);
console.log(`Wrote ${payload.length} posts to ${outPath}`);
