import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(
  root,
  "src/lib/shoppable/store-catalogs/meundies-home.json",
);

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractImageUrl(html) {
  const nextImage = html.match(
    /\/_next\/image\?url=(https[^"&]+cdn\.shopify[^"&]+)/i,
  )?.[1];
  if (nextImage) {
    return decodeHtml(decodeURIComponent(nextImage));
  }

  const shopifyImage = html.match(
    /(https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\\]+?\.(?:png|jpe?g|webp)(?:\?[^"'\\]*)?)/i,
  )?.[1];
  if (shopifyImage) {
    return decodeHtml(shopifyImage);
  }

  const ogImage = html.match(
    /<meta property="og:image" content="([^"]+)"/i,
  )?.[1];
  if (ogImage) {
    return decodeHtml(ogImage);
  }

  const twitterImage = html.match(
    /<meta name="twitter:image" content="([^"]+)"/i,
  )?.[1];
  if (twitterImage) {
    return decodeHtml(twitterImage);
  }

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const image = item.image;
        if (typeof image === "string" && image.startsWith("http")) {
          return image;
        }
        if (Array.isArray(image) && image[0]) {
          return image[0];
        }
      }
    } catch {
      continue;
    }
  }

  const inlineImage = html.match(
    /"(https:\/\/[^"]+(?:cdn\.shopify|cdn\.builder|meundies)[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
  )?.[1];
  return inlineImage ? decodeHtml(inlineImage) : null;
}

async function fetchProductPage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
let updated = 0;
let failed = 0;

for (const product of catalog.products) {
  if (!product.url.includes("/products/")) {
    console.log(`skip ${product.label}: collection URL`);
    continue;
  }

  if (product.imageUrl) {
    console.log(`skip ${product.label}: already has image`);
    continue;
  }

  try {
    const html = await fetchProductPage(product.url);
    const imageUrl = extractImageUrl(html);
    if (!imageUrl) {
      failed += 1;
      console.warn(`no image found for ${product.label} (${product.url})`);
      continue;
    }

    product.imageUrl = imageUrl;
    updated += 1;
    console.log(`ok ${product.label}`);
  } catch (error) {
    failed += 1;
    console.warn(`failed ${product.label}: ${error.message}`);
  }
}

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`\nUpdated ${updated} images, ${failed} failed.`);
