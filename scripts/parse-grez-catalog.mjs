import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.thegrezway.cl";
const outPath = join(root, "src/lib/shoppable/store-catalogs/grez-home.json");
const limit = Number(process.argv[2] ?? 50);

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/‑/g, "-");
}

function extractCode(title) {
  return title
    .split("|")[0]
    .trim()
    .replace(/\/.*$/, "")
    .replace(/‑/g, "-")
    .trim();
}

function buildLabel(title) {
  return extractCode(title).replace(/\s+/g, " ");
}

function slugify(title) {
  return normalize(extractCode(title))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56);
}

function extractKeywords(title) {
  const keywords = new Set();
  const code = extractCode(title);
  const normalizedCode = normalize(code);

  keywords.add(code);
  keywords.add(normalizedCode);
  keywords.add(code.replace(/-/g, " "));
  keywords.add(normalizedCode.replace(/-/g, " "));

  if (/^pack/i.test(code)) {
    const packName = code.replace(/^pack\s+/i, "").trim();
    keywords.add(packName);
    keywords.add(normalize(packName));
  }

  const spanishBits = title
    .split("|")
    .slice(1)
    .join(" ")
    .split(/[&/,]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= 4);

  for (const bit of spanishBits.slice(0, 4)) {
    keywords.add(normalize(bit));
  }

  const aliasMap = {
    "redox-vital ii": ["redox vital", "redox-vital", "berberina"],
    "sleep-vital": ["sleep vital", "sueno reparador", "descanso", "sueno"],
    "elec-vital": ["elec vital", "electrolitos", "minerales"],
    "prob-vital": ["prob vital", "probioticos", "simbiotico", "microbiota"],
    "prot-vital": ["prot vital", "proteina", "colageno"],
    "omega3-vital": ["omega 3", "omega3", "krill"],
    "magzi-vital t": ["magzi vital", "magnesio", "magzi-vital"],
    "pack sueno reparador": [
      "pack sueño",
      "sueno reparador",
      "descanso",
      "sueno",
    ],
    "pack control del estres": [
      "control del estres",
      "cortisol",
      "deshinchazon",
      "estres",
    ],
    "pack proteccion muscular": [
      "proteccion muscular",
      "musc-vital",
      "creatina",
    ],
    "pack vientre plano": [
      "vientre plano",
      "digestion",
      "hinchazon",
      "estrenimiento",
    ],
    "pack tiroides": ["tiroides", "tirox-vital"],
    "pack presion arterial": ["presion arterial", "tension"],
    "pack claridad mental": ["claridad mental", "memoria", "foco"],
    "bicol-vital": ["bicol vital", "colageno", "piel", "cabello"],
    "multi-vital": ["multi vital", "multivitaminico", "vitaminas"],
    "musc-vital plus": ["musc vital", "creatina", "glutamina"],
    "tirox-vital": ["tirox vital", "tiroides"],
  };

  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (normalizedCode.includes(key)) {
      for (const alias of aliases) {
        keywords.add(alias);
      }
    }
  }

  return [...keywords]
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 3)
    .sort((left, right) => right.length - left.length);
}

const response = await fetch(`${ORIGIN}/products.json?limit=${limit}`);
if (!response.ok) {
  throw new Error(`Failed to fetch Grez catalog: ${response.status}`);
}

const data = await response.json();
const byHandle = new Map();

for (const product of data.products) {
  const isSubscription = /suscripci[oó]n/i.test(product.title);
  const baseHandle = product.handle.replace(/-suscripcion.*$/, "");
  const existing = byHandle.get(baseHandle);

  if (!existing || (existing.isSubscription && !isSubscription)) {
    byHandle.set(baseHandle, { ...product, isSubscription });
  }
}

const products = [...byHandle.values()]
  .filter((product) => !/suscripci[oó]n/i.test(product.title))
  .map((product) => {
    const label = buildLabel(product.title);

    return {
      id: slugify(product.title),
      label,
      url: `${ORIGIN}/products/${product.handle}`,
      keywords: extractKeywords(product.title),
      priority: /^pack/i.test(label) ? 11 : 10,
    };
  })
  .sort(
    (left, right) =>
      right.priority - left.priority || left.label.localeCompare(right.label),
  );

writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      storeHostname: "thegrezway.cl",
      source: ORIGIN,
      fetchedFrom: `${ORIGIN}/products.json?limit=${limit}`,
      products,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${products.length} products to ${outPath}`);
