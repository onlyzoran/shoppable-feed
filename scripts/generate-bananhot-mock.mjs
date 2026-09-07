import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "mock-data/bananhot.json");
const USERNAME = "bananhot";

const SHORTCODES = [
  "C94N-1to3V2",
  "C9F2e4_o7BC",
  "DGL0bETIJEE",
  "By16C7iAIa6",
  "CBK42XapP00",
  "CDxy_jYJTmk",
  "CSJG2eXIlNL",
  "CwIksi1oroj",
  "DJaB5KrIgqa",
];

const SUPPLEMENTAL_POSTS = [
  {
    caption:
      "NINA SCARLET RED — our signature cheeky cut in a bold scarlet shade. Shop the full set at bananhot.com",
    productQuery: "nina scarlet red",
  },
  {
    caption:
      "LUNA ROCKROSE bikini season is here. Soft tones, perfect fit — link in bio to bananhot.com",
    productQuery: "luna rockrose",
  },
  {
    caption:
      "VECNA LACE DRESS for sunset dinners after the beach. Resortwear from BANANHOT — bananhot.com",
    productQuery: "vecna lace",
  },
];

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function readMeta(html, property) {
  const match = html.match(
    new RegExp(`property="${property}" content="([^"]+)"`),
  );
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function extractCaption(description) {
  const match = description.match(/:\s*"([\s\S]+?)"\.?\s*$/);
  if (match?.[1]) {
    return match[1]
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCodePoint(Number.parseInt(hex, 16)),
      )
      .replace(/^"+|"+$/g, "")
      .trim();
  }

  const parts = description.split(": ");
  return parts.length > 1 ? parts.slice(1).join(": ").replace(/^"+|"+$/g, "").trim() : description;
}

function extractCounts(description) {
  const likesMatch = description.match(/([\d.,]+)\s+likes?/i);
  const commentsMatch = description.match(/([\d.,]+)\s+comments?/i);

  const parseCount = (value) => {
    if (!value) {
      return 0;
    }

    return Number.parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
  };

  return {
    likesCount: parseCount(likesMatch?.[1]),
    commentsCount: parseCount(commentsMatch?.[1]),
  };
}

function vendorId(seed) {
  return createHash("sha1").update(seed).digest("hex");
}

async function scrapePost(shortcode) {
  for (const path of [`p/${shortcode}`, `reel/${shortcode}`]) {
    const response = await fetch(`https://www.instagram.com/${path}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    const ogUrl = readMeta(html, "og:url");
    const owner =
      ogUrl.match(/instagram\.com\/([^/]+)\/(?:p|reel)\//)?.[1] ?? "";

    if (owner !== USERNAME) {
      continue;
    }

    const description = readMeta(html, "og:description");
    const image = readMeta(html, "og:image");
    const { likesCount, commentsCount } = extractCounts(description);

    if (!image) {
      continue;
    }

    const isReel = ogUrl.includes("/reel/");

    return {
      vendorId: vendorId(`${USERNAME}:${shortcode}`),
      type: isReel ? "reel" : "image",
      link: isReel
        ? `https://www.instagram.com/reel/${shortcode}/`
        : `https://www.instagram.com/p/${shortcode}/`,
      publishedAt: new Date().toISOString(),
      author: {
        username: USERNAME,
        profilePictureUrl: "",
        isVerifiedProfile: false,
        name: "BANANHOT",
        biography: null,
      },
      media: [{ type: isReel ? "video" : "image", thumbnail: { url: image } }],
      caption: extractCaption(description),
      commentsCount,
      likesCount,
      shareCount: null,
    };
  }

  return null;
}

function findProduct(products, query) {
  const normalizedQuery = query.toLowerCase();

  return (
    products.find((product) =>
      product.title.toLowerCase().includes(normalizedQuery),
    ) ?? products[0]
  );
}

const catalogResponse = await fetch("https://bananhot.com/products.json?limit=100");
if (!catalogResponse.ok) {
  throw new Error(`Failed to fetch Bananhot products: ${catalogResponse.status}`);
}

const shopifyProducts = (await catalogResponse.json()).products ?? [];
const payload = [];

for (const shortcode of SHORTCODES) {
  process.stdout.write(`Fetching @${USERNAME} /${shortcode}... `);

  try {
    const post = await scrapePost(shortcode);
    if (!post) {
      console.log("skip");
      continue;
    }

    payload.push(post);
    console.log("ok");
  } catch (error) {
    console.log(
      `error (${error instanceof Error ? error.message : String(error)})`,
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
}

for (const [index, template] of SUPPLEMENTAL_POSTS.entries()) {
  const product = findProduct(shopifyProducts, template.productQuery);
  const image = product?.images?.[0]?.src;
  if (!image) {
    continue;
  }

  const seed = `bananhot:supplement:${index + 1}`;
  payload.push({
    vendorId: vendorId(seed),
    type: "image",
    link: `https://www.instagram.com/p/${SHORTCODES[index]}/`,
    publishedAt: new Date(Date.UTC(2026, 8, 1 - index, 10, 0, 0)).toISOString(),
    author: {
      username: USERNAME,
      profilePictureUrl: "",
      isVerifiedProfile: false,
      name: "BANANHOT",
      biography: null,
    },
    media: [{ type: "image", thumbnail: { url: image } }],
    caption: template.caption,
    commentsCount: 12 + index,
    likesCount: 640 + index * 37,
    shareCount: null,
  });
}

if (payload.length < 10) {
  console.error(`Only ${payload.length} posts generated, need at least 10`);
  process.exitCode = 1;
} else {
  writeFileSync(outPath, `${JSON.stringify({ payload }, null, 4)}\n`);
  console.log(`Wrote ${payload.length} posts to mock-data/bananhot.json`);
}
