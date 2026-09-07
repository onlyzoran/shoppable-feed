import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { REAL_EXAMPLE_POSTS } from "./real-examples.config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  const match = description.match(/:\s*"([\s\S]+)"\s*$/);
  if (match?.[1]) {
    return match[1].replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    );
  }

  const parts = description.split(": ");
  return parts.length > 1 ? parts.slice(1).join(": ") : description;
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

async function scrapePost(username, shortcode) {
  const response = await fetch(`https://www.instagram.com/p/${shortcode}/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${shortcode}`);
  }

  const html = await response.text();
  const ogUrl = readMeta(html, "og:url");
  const owner =
    ogUrl.match(/instagram\.com\/([^/]+)\/(?:p|reel)\//)?.[1] ?? "";

  if (owner !== username) {
    return null;
  }

  const description = readMeta(html, "og:description");
  const image = readMeta(html, "og:image");
  const { likesCount, commentsCount } = extractCounts(description);

  if (!image) {
    return null;
  }

  return {
    vendorId: vendorId(`${username}:${shortcode}`),
    type: "image",
    link: `https://www.instagram.com/p/${shortcode}/`,
    publishedAt: new Date().toISOString(),
    author: {
      username,
      profilePictureUrl: "",
      isVerifiedProfile: false,
      name: username,
      biography: null,
    },
    media: [{ type: "image", thumbnail: { url: image } }],
    caption: extractCaption(description),
    commentsCount,
    likesCount,
    shareCount: null,
  };
}

for (const profile of REAL_EXAMPLE_POSTS) {
  const payload = [];

  for (const shortcode of profile.shortcodes) {
    process.stdout.write(`Fetching @${profile.username} /p/${shortcode}... `);

    try {
      const post = await scrapePost(profile.username, shortcode);
      if (!post) {
        console.log("skip (wrong owner or missing media)");
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

  if (payload.length < profile.minPosts) {
    console.error(
      `Only ${payload.length} posts for @${profile.username}, need at least ${profile.minPosts}`,
    );
    process.exitCode = 1;
    continue;
  }

  const outPath = join(root, "mock-data", profile.fileName);
  writeFileSync(outPath, `${JSON.stringify({ payload }, null, 4)}\n`);
  console.log(`Wrote ${payload.length} posts to mock-data/${profile.fileName}`);
}
