import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogsDir = join(root, "src/lib/shoppable/store-catalogs");

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url.replace(/\/$/, "");
  }
}

function formatRubPrice(raw) {
  const digits = String(raw).replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }

  const value = Number(digits);
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}

function formatTildaPrice(item) {
  const editionPrice = item.editions?.[0]?.price;
  const raw = editionPrice || item.price;
  if (!raw) {
    return null;
  }

  const normalized = String(raw).replace(/\s/g, "").replace(/\.00$/, "");
  const digits = normalized.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }

  return `${Number(digits).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}

function formatGrezPrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return null;
  }

  const formatted = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${formatted}`;
}

function parseManekenPrices(html) {
  const pricesByPath = new Map();

  for (const block of html.split('class="item-wrap"')) {
    const hrefMatch = block.match(
      /<a href="(\/catalog\/[^"]+)" class="item-tile-catalog">/,
    );
    const priceMatch = block.match(
      /<span class="tile-price"[^>]*>\s*([\d\s&nbsp;]+)\s*р\./i,
    );

    if (hrefMatch && priceMatch) {
      const price = formatRubPrice(priceMatch[1]);
      if (price) {
        pricesByPath.set(hrefMatch[1], price);
      }
    }
  }

  return pricesByPath;
}

async function fetchManekenLivePrice(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ShoppableFeedBot/1.0)" },
  });
  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const dataPrice = html.match(/data-price="(\d+)"/)?.[1];
  if (dataPrice) {
    return formatRubPrice(dataPrice);
  }

  const itemPrice = html.match(/id="calc_item_price">(\d+)/)?.[1];
  if (itemPrice) {
    return formatRubPrice(itemPrice);
  }

  const tilePrice = html.match(
    /<span class="tile-price"[^>]*>\s*([\d\s&nbsp;]+)\s*р\./i,
  )?.[1];
  return tilePrice ? formatRubPrice(tilePrice) : null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ShoppableFeedBot/1.0)" },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

function loadCatalog(fileName) {
  const path = join(catalogsDir, fileName);
  return { path, data: JSON.parse(readFileSync(path, "utf8")) };
}

function saveCatalog(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function applyPricesByUrl(catalog, priceByUrl, label) {
  let updated = 0;
  let missing = 0;

  for (const product of catalog.products) {
    const key = normalizeUrl(product.url);
    const price = priceByUrl.get(key);
    if (price) {
      if (product.price !== price) {
        product.price = price;
        updated += 1;
      }
    } else {
      missing += 1;
      console.warn(`[${label}] no price for ${product.label} (${product.url})`);
    }
  }

  return { updated, missing };
}

async function syncManeken() {
  const htmlPath = join(root, "mock-data/manekenbrand-home.html");
  const { path, data } = loadCatalog("manekenbrand-home.json");
  const html = readFileSync(htmlPath, "utf8");
  const pricesByPath = parseManekenPrices(html);
  const priceByUrl = new Map();

  for (const [catalogPath, price] of pricesByPath) {
    priceByUrl.set(normalizeUrl(`https://manekenbrand.com${catalogPath}`), price);
  }

  const stats = applyPricesByUrl(data, priceByUrl, "MANEKEN");

  for (const product of data.products) {
    if (priceByUrl.has(normalizeUrl(product.url))) {
      continue;
    }

    const livePrice = await fetchManekenLivePrice(product.url);
    if (livePrice) {
      product.price = livePrice;
      stats.updated += 1;
      stats.missing -= 1;
      console.log(`[MANEKEN] live price ${product.label}: ${livePrice}`);
    }
  }

  saveCatalog(path, data);
  console.log(`MANEKEN: updated ${stats.updated}, missing ${stats.missing}`);
}

async function syncTildaCatalog(fileName, apiUrl, cachePath) {
  const { path, data } = loadCatalog(fileName);
  const payload = await fetchJson(apiUrl);
  writeFileSync(cachePath, `${JSON.stringify(payload, null, 2)}\n`);
  const products = payload.products ?? [];

  const priceByUrl = new Map();
  for (const item of products) {
    if (!item.url) {
      continue;
    }
    const price = formatTildaPrice(item);
    if (price) {
      priceByUrl.set(normalizeUrl(item.url), price);
    }
  }

  const stats = applyPricesByUrl(data, priceByUrl, fileName);
  saveCatalog(path, data);
  console.log(`${fileName}: updated ${stats.updated}, missing ${stats.missing}`);
}

async function syncGrez() {
  const { path, data } = loadCatalog("grez-home.json");
  const payload = await fetchJson("https://www.thegrezway.cl/products.json?limit=250");
  const priceByUrl = new Map();

  for (const product of payload.products ?? []) {
    if (/suscripci[oó]n/i.test(product.title)) {
      continue;
    }

    const variant = product.variants?.[0];
    if (!variant?.price) {
      continue;
    }

    priceByUrl.set(
      normalizeUrl(`https://www.thegrezway.cl/products/${product.handle}`),
      formatGrezPrice(variant.price),
    );
  }

  const stats = applyPricesByUrl(data, priceByUrl, "GREZ");
  saveCatalog(path, data);
  console.log(`GREZ: updated ${stats.updated}, missing ${stats.missing}`);
}

function normalizeCaption(text) {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function matchCatalogProduct(caption, catalog) {
  const normalized = normalizeCaption(caption);
  let best = null;

  for (const product of catalog.products) {
    for (const keyword of product.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, " ");
      if (!normalized.includes(normalizedKeyword)) {
        continue;
      }

      const score = normalizedKeyword.length + (product.priority ?? 0) * 100;
      if (!best || score > best.score) {
        best = { product, score };
      }
    }
  }

  return best?.product ?? null;
}

function auditPostsOnExamples() {
  const examples = [
    {
      label: "MANEKEN",
      file: "manekenbrand.json",
      catalogFile: "manekenbrand-home.json",
      profileExternalUrl: "https://manekenbrand.com",
    },
    {
      label: "MADJ",
      file: "madj_store.json",
      catalogFile: "madj-home.json",
      profileExternalUrl: "https://madj.store",
    },
    {
      label: "DROP'S",
      file: "dropsstore.json",
      catalogFile: "dropsstore-home.json",
      profileExternalUrl: "https://www.dropsstore.ru",
    },
    {
      label: "GREZ",
      file: "thegrezway.json",
      catalogFile: "grez-home.json",
      profileExternalUrl: "https://www.thegrezway.cl",
    },
  ];

  console.log("\nPost product audit:");

  for (const example of examples) {
    const payload = JSON.parse(
      readFileSync(join(root, "mock-data", example.file), "utf8"),
    );
    const catalog = JSON.parse(
      readFileSync(join(catalogsDir, example.catalogFile), "utf8"),
    );

    const posts = (payload.payload ?? payload.posts ?? payload.data ?? []).slice(
      0,
      60,
    );
    const matched = new Map();

    for (const post of posts) {
      const caption = post.caption ?? post.text ?? "";
      const product = matchCatalogProduct(caption, catalog);
      if (!product) {
        continue;
      }

      const entry = matched.get(product.id) ?? {
        label: product.label,
        price: product.price ?? "(no price)",
        posts: 0,
      };
      entry.posts += 1;
      entry.price = product.price ?? entry.price;
      matched.set(product.id, entry);
    }

    console.log(`\n${example.label} (${matched.size} products on ${posts.length} posts):`);
    for (const [id, info] of [...matched.entries()].sort((a, b) => b[1].posts - a[1].posts)) {
      console.log(`  - ${info.label}: ${info.price} (${info.posts} posts)`);
      if (!info.price || info.price === "(no price)") {
        console.warn(`    ⚠ missing price for ${id}`);
      }
    }
  }
}

await syncManeken();
await syncTildaCatalog(
  "madj-home.json",
  "https://store.tildaapi.com/api/getproductslist/?storepartuid=606657650631&recid=564342696&c=6845764&size=100",
  join(root, "mock-data/madj-products.json"),
);
await syncTildaCatalog(
  "dropsstore-home.json",
  "https://store.tildaapi.com/api/getproductslist/?storepartuid=474224133802&recid=785208032&c=8485399&size=100",
  join(root, "mock-data/drops-products.json"),
);
await syncGrez();
auditPostsOnExamples();
