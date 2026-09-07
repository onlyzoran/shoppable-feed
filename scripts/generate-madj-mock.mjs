import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsPath =
  process.argv[2] ?? join(root, "mock-data/madj-products.json");
const outPath =
  process.argv[3] ?? join(root, "mock-data/madj_store.json");

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
      "MADJ — одежда через ощущения. Новый дроп уже на сайте madj.store",
    image:
      "https://static.tildacdn.com/tild3230-3734-4631-b630-363962653563/logo-2.svg",
  },
  {
    caption: "Летний mood: свобода движений, мягкие ткани и спокойные оттенки.",
    image: uniqueProducts[0]?.gallery
      ? JSON.parse(uniqueProducts[0].gallery)[0]?.img
      : null,
  },
  {
    caption: "Загляните в наш шоурум или закажите онлайн — доставка по России.",
    image: uniqueProducts[1]?.gallery
      ? JSON.parse(uniqueProducts[1].gallery)[0]?.img
      : null,
  },
];

function vendorId(seed) {
  return createHash("sha1").update(seed).digest("hex");
}

function shortcode(index) {
  return `MadjMock${String(index).padStart(2, "0")}`;
}

function buildPost(index, caption, imageUrl, type = "image") {
  const code = shortcode(index);
  const media =
    type === "video"
      ? [
          {
            type: "video",
            url: imageUrl,
            cover: { thumbnail: { url: imageUrl.replace(".mp4", ".jpg") } },
          },
        ]
      : [{ type: "image", thumbnail: { url: imageUrl } }];

  return {
    vendorId: vendorId(code),
    type: type === "video" ? "reel" : "image",
    link: `https://www.instagram.com/p/${code}/`,
    publishedAt: new Date(Date.UTC(2026, 8, 7 - index, 12, 0, 0)).toISOString(),
    author: {
      username: "madj_store",
      profilePictureUrl: "",
      isVerifiedProfile: false,
      name: "MADJ",
      biography: null,
    },
    media,
    caption,
    commentsCount: 12 + index,
    likesCount: 180 + index * 17,
    shareCount: null,
  };
}

const payload = [];

uniqueProducts.slice(0, 12).forEach((product, index) => {
  const image = JSON.parse(product.gallery)[0]?.img;
  if (!image) {
    return;
  }

  payload.push(
    buildPost(
      index + 1,
      `${product.title} — ${product.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)}…`,
      image,
    ),
  );
});

genericPosts.forEach((post, offset) => {
  if (!post.image) {
    return;
  }

  payload.push(buildPost(payload.length + 1, post.caption, post.image));
});

writeFileSync(
  outPath,
  `${JSON.stringify({ payload }, null, 4)}\n`,
);

console.log(`Wrote ${payload.length} posts to ${outPath}`);
