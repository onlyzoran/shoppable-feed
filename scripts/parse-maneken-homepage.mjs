import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = process.argv[2] ?? join(root, "mock-data/manekenbrand-home.html");
const outPath =
  process.argv[3] ??
  join(root, "src/lib/shoppable/store-catalogs/manekenbrand-home.json");

const ORIGIN = "https://manekenbrand.com";

function unescapeName(value) {
  return value.replace(/\\'/g, "'");
}

function normalizeQuotes(value) {
  return unescapeName(value)
    .toLowerCase()
    .replace(/[\u201c\u201d\u201e""„"]/g, '"');
}

function extractKeywords(name) {
  const normalized = normalizeQuotes(name);
  const keywords = new Set();

  for (const match of normalized.matchAll(/"([^"]+)"/g)) {
    const quoted = match[1].trim();
    if (quoted.length >= 3) {
      keywords.add(quoted);
    }
  }

  const quoted = [...keywords];
  for (const phrase of quoted) {
    if (/champion/i.test(phrase)) {
      keywords.add("костюм champion");
      keywords.add("костюм чемпион");
    }
    if (/core edition legacy/i.test(phrase)) {
      keywords.add("core edition legacy");
      keywords.add("core edition legacy 18");
    }
    if (/zip sporty peach/i.test(phrase)) {
      keywords.add("zip sporty peach");
    } else if (/zip sporty/i.test(phrase)) {
      keywords.add("zip sporty");
    }
  }

  return [...keywords].sort((left, right) => right.length - left.length);
}

function buildLabel(name) {
  const clean = unescapeName(name);
  const quoted = clean.match(/[\u201c"]([^\u201d"]+)[\u201d"]/)?.[1];
  if (quoted) {
    const kind = clean.split(/[\u201c\u201d""]/)[0].trim().toLowerCase();
    if (kind.startsWith("костюм")) {
      return `Костюм ${quoted}`;
    }
    if (kind.startsWith("ветровка")) {
      return `Ветровка ${quoted}`;
    }
    if (kind.startsWith("футболка")) {
      return `Футболка ${quoted}`;
    }
    if (kind.startsWith("пуховик")) {
      return `Пуховик ${quoted}`;
    }
    return quoted;
  }

  return clean.split("|")[0].trim();
}

function slugify(name) {
  return unescapeName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function parseProducts(html) {
  const products = [];
  const seenUrls = new Set();

  for (const match of html.matchAll(
    /'NAME':'((?:\\'|[^'])*)','DETAIL_PAGE_URL':'(\/catalog\/[^']+)'/g,
  )) {
    const name = unescapeName(match[1]);
    const url = `${ORIGIN}${match[2]}`;
    if (seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    const keywords = extractKeywords(name);
    if (keywords.length === 0) {
      continue;
    }

    products.push({
      id: slugify(name),
      label: buildLabel(name),
      url,
      keywords,
      priority: 10,
    });
  }

  return products;
}

const html = readFileSync(htmlPath, "utf8");
const products = parseProducts(html);

writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      storeHostname: "manekenbrand.com",
      source: ORIGIN,
      fetchedFrom: htmlPath.replace(`${root}/`, ""),
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
for (const product of products) {
  console.log(`- ${product.label}: ${product.url}`);
}
