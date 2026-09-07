import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogsDir = join(root, "src/lib/shoppable/store-catalogs");
const MANEKEN_ORIGIN = "https://manekenbrand.com";

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

function formatUsdPrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return null;
  }

  if (Number.isInteger(value)) {
    return `$${value}`;
  }

  return `$${value.toFixed(2)}`;
}

function extractTildaImageUrl(item) {
  const editionImage = item.editions?.[0]?.img?.trim();
  if (editionImage) {
    return editionImage;
  }

  if (!item.gallery) {
    return null;
  }

  try {
    const gallery = JSON.parse(item.gallery);
    return gallery[0]?.img ?? null;
  } catch {
    return null;
  }
}

function toAbsoluteManekenUrl(pathOrUrl) {
  if (!pathOrUrl) {
    return null;
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return `${MANEKEN_ORIGIN}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function parseManekenCatalog(html) {
  const byPath = new Map();

  for (const block of html.split('class="item-wrap"')) {
    const hrefMatch = block.match(
      /<a href="(\/catalog\/[^"]+)" class="item-tile-catalog">/,
    );
    if (!hrefMatch) {
      continue;
    }

    const priceMatch = block.match(
      /<span class="tile-price"[^>]*>\s*([\d\s&nbsp;]+)\s*р\./i,
    );
    const imageMatch = block.match(/<img loading="lazy" src="([^"]+)"/);

    byPath.set(hrefMatch[1], {
      price: priceMatch ? formatRubPrice(priceMatch[1]) : null,
      imageUrl: imageMatch ? toAbsoluteManekenUrl(imageMatch[1]) : null,
    });
  }

  return byPath;
}

async function fetchManekenLiveData(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ShoppableFeedBot/1.0)" },
  });
  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const dataPrice = html.match(/data-price="(\d+)"/)?.[1];
  const itemPrice = html.match(/id="calc_item_price">(\d+)/)?.[1];
  const tilePrice = html.match(
    /<span class="tile-price"[^>]*>\s*([\d\s&nbsp;]+)\s*р\./i,
  )?.[1];
  const ogImage = html.match(
    /<meta property="og:image" content="([^"]+)"/i,
  )?.[1];
  const productImage = html.match(
    /class="product-item-detail-slider-image[^"]*"[^>]*src="([^"]+)"/i,
  )?.[1];

  return {
    price: dataPrice
      ? formatRubPrice(dataPrice)
      : itemPrice
        ? formatRubPrice(itemPrice)
        : tilePrice
          ? formatRubPrice(tilePrice)
          : null,
    imageUrl: toAbsoluteManekenUrl(ogImage ?? productImage),
  };
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

function applyCatalogFieldsByUrl(catalog, fieldsByUrl, label) {
  let priceUpdated = 0;
  let imageUpdated = 0;
  let missingPrice = 0;
  let missingImage = 0;

  for (const product of catalog.products) {
    const key = normalizeUrl(product.url);
    const fields = fieldsByUrl.get(key);

    if (fields?.price) {
      if (product.price !== fields.price) {
        product.price = fields.price;
        priceUpdated += 1;
      }
    } else {
      missingPrice += 1;
      console.warn(`[${label}] no price for ${product.label} (${product.url})`);
    }

    if (fields?.imageUrl) {
      if (product.imageUrl !== fields.imageUrl) {
        product.imageUrl = fields.imageUrl;
        imageUpdated += 1;
      }
    } else {
      missingImage += 1;
      console.warn(`[${label}] no image for ${product.label} (${product.url})`);
    }
  }

  return { priceUpdated, imageUpdated, missingPrice, missingImage };
}

async function syncManeken() {
  const htmlPath = join(root, "mock-data/manekenbrand-home.html");
  const { path, data } = loadCatalog("manekenbrand-home.json");
  const html = readFileSync(htmlPath, "utf8");
  const catalogByPath = parseManekenCatalog(html);
  const fieldsByUrl = new Map();

  for (const [catalogPath, fields] of catalogByPath) {
    fieldsByUrl.set(normalizeUrl(`${MANEKEN_ORIGIN}${catalogPath}`), fields);
  }

  const stats = applyCatalogFieldsByUrl(data, fieldsByUrl, "MANEKEN");

  for (const product of data.products) {
    const key = normalizeUrl(product.url);
    const existing = fieldsByUrl.get(key) ?? {};

    if (existing.price && existing.imageUrl) {
      continue;
    }

    const liveData = await fetchManekenLiveData(product.url);
    if (!liveData) {
      continue;
    }

    if (!existing.price && liveData.price && product.price !== liveData.price) {
      product.price = liveData.price;
      stats.priceUpdated += 1;
      stats.missingPrice -= 1;
      console.log(`[MANEKEN] live price ${product.label}: ${liveData.price}`);
    }

    if (
      !existing.imageUrl &&
      liveData.imageUrl &&
      product.imageUrl !== liveData.imageUrl
    ) {
      product.imageUrl = liveData.imageUrl;
      stats.imageUpdated += 1;
      stats.missingImage -= 1;
      console.log(`[MANEKEN] live image ${product.label}`);
    }
  }

  saveCatalog(path, data);
  console.log(
    `MANEKEN: prices ${stats.priceUpdated}, images ${stats.imageUpdated}, missing price ${stats.missingPrice}, missing image ${stats.missingImage}`,
  );
}

async function syncTildaCatalog(fileName, apiUrl, cachePath) {
  const { path, data } = loadCatalog(fileName);
  const payload = await fetchJson(apiUrl);
  writeFileSync(cachePath, `${JSON.stringify(payload, null, 2)}\n`);
  const products = payload.products ?? [];

  const fieldsByUrl = new Map();
  for (const item of products) {
    if (!item.url) {
      continue;
    }

    fieldsByUrl.set(normalizeUrl(item.url), {
      price: formatTildaPrice(item),
      imageUrl: extractTildaImageUrl(item),
    });
  }

  const stats = applyCatalogFieldsByUrl(data, fieldsByUrl, fileName);
  saveCatalog(path, data);
  console.log(
    `${fileName}: prices ${stats.priceUpdated}, images ${stats.imageUpdated}, missing price ${stats.missingPrice}, missing image ${stats.missingImage}`,
  );
}

async function syncGrez() {
  const { path, data } = loadCatalog("grez-home.json");
  const payload = await fetchJson("https://www.thegrezway.cl/products.json?limit=250");
  const fieldsByUrl = new Map();

  for (const product of payload.products ?? []) {
    if (/suscripci[oó]n/i.test(product.title)) {
      continue;
    }

    const variant = product.variants?.[0];
    if (!variant?.price) {
      continue;
    }

    fieldsByUrl.set(
      normalizeUrl(`https://www.thegrezway.cl/products/${product.handle}`),
      {
        price: formatGrezPrice(variant.price),
        imageUrl: product.images?.[0]?.src ?? null,
      },
    );
  }

  const stats = applyCatalogFieldsByUrl(data, fieldsByUrl, "GREZ");
  saveCatalog(path, data);
  console.log(
    `GREZ: prices ${stats.priceUpdated}, images ${stats.imageUpdated}, missing price ${stats.missingPrice}, missing image ${stats.missingImage}`,
  );
}

async function syncBananhot() {
  const { path, data } = loadCatalog("bananhot-home.json");
  const fieldsByUrl = new Map();

  for (let page = 1; page <= 6; page += 1) {
    const payload = await fetchJson(
      `https://bananhot.com/products.json?limit=250&page=${page}`,
    );
    const batch = payload.products ?? [];
    if (batch.length === 0) {
      break;
    }

    for (const product of batch) {
      const variant = product.variants?.[0];
      if (!variant?.price) {
        continue;
      }

      fieldsByUrl.set(
        normalizeUrl(`https://bananhot.com/products/${product.handle}`),
        {
          price: formatUsdPrice(variant.price),
          imageUrl: product.images?.[0]?.src ?? null,
        },
      );
    }
  }

  const stats = applyCatalogFieldsByUrl(data, fieldsByUrl, "BANANHOT");
  saveCatalog(path, data);
  console.log(
    `BANANHOT: prices ${stats.priceUpdated}, images ${stats.imageUpdated}, missing price ${stats.missingPrice}, missing image ${stats.missingImage}`,
  );
}

async function syncAdahlazorgan() {
  const { path, data } = loadCatalog("adahlazorgan-home.json");
  const fieldsByUrl = new Map();

  for (let page = 1; page <= 4; page += 1) {
    const payload = await fetchJson(
      `https://adahlazorgan.com/products.json?limit=250&page=${page}`,
    );
    const batch = payload.products ?? [];
    if (batch.length === 0) {
      break;
    }

    for (const product of batch) {
      const variant = product.variants?.[0];
      if (!variant?.price) {
        continue;
      }

      fieldsByUrl.set(
        normalizeUrl(`https://adahlazorgan.com/products/${product.handle}`),
        {
          price: formatUsdPrice(variant.price),
          imageUrl: product.images?.[0]?.src ?? null,
        },
      );
    }
  }

  const stats = applyCatalogFieldsByUrl(data, fieldsByUrl, "ADAH");
  saveCatalog(path, data);
  console.log(
    `ADAH: prices ${stats.priceUpdated}, images ${stats.imageUpdated}, missing price ${stats.missingPrice}, missing image ${stats.missingImage}`,
  );
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
    },
    {
      label: "MADJ",
      file: "madj_store.json",
      catalogFile: "madj-home.json",
    },
    {
      label: "DROP'S",
      file: "dropsstore.json",
      catalogFile: "dropsstore-home.json",
    },
    {
      label: "GREZ",
      file: "thegrezway.json",
      catalogFile: "grez-home.json",
    },
    {
      label: "BANANHOT",
      file: "bananhot.json",
      catalogFile: "bananhot-home.json",
    },
    {
      label: "ADAH",
      file: "adahlazorgan.json",
      catalogFile: "adahlazorgan-home.json",
    },
  ];

  console.log("\nPost product audit:");

  for (const example of examples) {
    const mockPath = join(root, "mock-data", example.file);
    if (!existsSync(mockPath)) {
      console.warn(`Skipping audit for ${example.label}: mock file missing`);
      continue;
    }

    const payload = JSON.parse(readFileSync(mockPath, "utf8"));
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
        imageUrl: product.imageUrl ? "yes" : "(no image)",
        posts: 0,
      };
      entry.posts += 1;
      entry.price = product.price ?? entry.price;
      entry.imageUrl = product.imageUrl ? "yes" : entry.imageUrl;
      matched.set(product.id, entry);
    }

    console.log(`\n${example.label} (${matched.size} products on ${posts.length} posts):`);
    for (const [id, info] of [...matched.entries()].sort((a, b) => b[1].posts - a[1].posts)) {
      console.log(
        `  - ${info.label}: ${info.price}, image ${info.imageUrl} (${info.posts} posts)`,
      );
      if (!info.price || info.price === "(no price)") {
        console.warn(`    ⚠ missing price for ${id}`);
      }
      if (info.imageUrl !== "yes") {
        console.warn(`    ⚠ missing image for ${id}`);
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
await syncBananhot();
await syncAdahlazorgan();
auditPostsOnExamples();
