import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "mock-data/allbirds.json");
const USERNAME = "allbirds";

const SHORTCODES = [
  "C_VnVCuNdxp",
  "DHExample001",
  "DHExample002",
  "DHExample003",
  "DHExample004",
  "DHExample005",
  "DHExample006",
  "DHExample007",
  "DHExample008",
  "DHExample009",
  "DHExample010",
  "DHExample011",
];

const SUPPLEMENTAL_POSTS = [
  {
    caption:
      "The Dasher NZ is built for everyday movement — cushioning, breathability, and all-day comfort. Shop the collection at allbirds.com",
    productQuery: "dasher nz",
  },
  {
    caption:
      "Meet the Cruiser: retro-inspired, naturally comfortable, and ready for wherever the day takes you. Link in bio.",
    productQuery: "cruiser",
  },
  {
    caption:
      "Tree Runner NZ season is here. Lightweight tree fiber upper, effortless style — allbirds.com",
    productQuery: "tree runner nz",
  },
  {
    caption:
      "Bold by nature: our Canvas Cruiser Slip On collection celebrates color without compromising comfort.",
    productQuery: "canvas cruiser",
  },
  {
    caption:
      "Runner NZ Remix — the best of our active heritage in a fresh silhouette. Tap to shop.",
    productQuery: "runner nz",
  },
  {
    caption:
      "Varsity energy, Allbirds comfort. Natural materials, cushioned midsole, everyday versatility.",
    productQuery: "varsity",
  },
  {
    caption:
      "The Wool Runner NZ is the icon that started it all — soft merino, light footprint, maximum comfort.",
    productQuery: "wool runner nz",
  },
  {
    caption:
      "Strider season: extra grip, organic cotton upper, dual-density foam for confident steps.",
    productQuery: "strider",
  },
  {
    caption:
      "Cruiser Terralux — plant-based leather alternative with the look you want and comfort you need.",
    productQuery: "terralux",
  },
  {
    caption:
      "Tree Dasher 2 keeps pace on morning walks, school runs, and everything in between.",
    productQuery: "tree dasher",
  },
  {
    caption:
      "Lounger Lift: elevated ease for travel days and lazy weekends. Find yours at allbirds.com",
    productQuery: "lounger lift",
  },
  {
    caption:
      "Rain or shine, Wool Runner-up Mizzles has you covered — weather-ready comfort without the bulk.",
    productQuery: "mizzles",
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
  return parts.length > 1
    ? parts.slice(1).join(": ").replace(/^"+|"+$/g, "").trim()
    : description;
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
        isVerifiedProfile: true,
        name: "Allbirds",
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

const catalogResponse = await fetch(
  "https://www.allbirds.com/products.json?limit=250",
);
if (!catalogResponse.ok) {
  throw new Error(`Failed to fetch Allbirds products: ${catalogResponse.status}`);
}

const shopifyProducts = (await catalogResponse.json()).products ?? [];
const payload = [];

for (const shortcode of SHORTCODES.slice(0, 1)) {
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
}

for (const [index, template] of SUPPLEMENTAL_POSTS.entries()) {
  const product = findProduct(shopifyProducts, template.productQuery);
  const image = product?.images?.[0]?.src;
  if (!image) {
    continue;
  }

  const seed = `allbirds:supplement:${index + 1}`;
  payload.push({
    vendorId: vendorId(seed),
    type: "image",
    link: `https://www.instagram.com/p/AllbirdsMock${String(index + 1).padStart(2, "0")}/`,
    publishedAt: new Date(Date.UTC(2026, 8, 12 - index, 14, 0, 0)).toISOString(),
    author: {
      username: USERNAME,
      profilePictureUrl: "",
      isVerifiedProfile: true,
      name: "Allbirds",
      biography: null,
    },
    media: [{ type: "image", thumbnail: { url: image } }],
    caption: template.caption,
    commentsCount: 18 + index * 3,
    likesCount: 1240 + index * 61,
    shareCount: null,
  });
}

if (payload.length < 10) {
  console.error(`Only ${payload.length} posts generated, need at least 10`);
  process.exitCode = 1;
} else {
  writeFileSync(outPath, `${JSON.stringify({ payload }, null, 4)}\n`);
  console.log(`Wrote ${payload.length} posts to mock-data/allbirds.json`);
}
