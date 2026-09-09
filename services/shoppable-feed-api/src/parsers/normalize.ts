export function normalizeOrigin(input: string): URL {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  parsed.hash = "";
  parsed.search = "";
  return parsed;
}

export function hostnameFromUrl(input: string): string {
  return normalizeOrigin(input).hostname.replace(/^www\./, "");
}

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/‑/g, "-");
}

export function slugify(value: string, maxLength = 72): string {
  return normalizeText(value)
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);
}

export function buildLabelFromTitle(title: string): string {
  return title.split(" - ")[0].trim().replace(/\s+/g, " ");
}

export function buildKeywordsFromTitle(title: string, handle?: string): string[] {
  const keywords = new Set<string>();
  const label = buildLabelFromTitle(title);
  const normalizedLabel = normalizeText(label);

  keywords.add(label);
  keywords.add(normalizedLabel);
  keywords.add(label.replace(/-/g, " "));

  if (handle) {
    keywords.add(handle.replace(/-/g, " "));
  }

  return [...keywords].sort((left, right) => right.length - left.length);
}

export function formatUsdPrice(amount: string | number): string | undefined {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return undefined;
  }

  if (Number.isInteger(value)) {
    return `$${value}`;
  }

  return `$${value.toFixed(2).replace(/\.00$/, "")}`;
}

export function formatTildaPrice(item: {
  price?: string | number;
  editions?: Array<{ price?: string | number }>;
}): string | undefined {
  const editionPrice = item.editions?.[0]?.price;
  const raw = editionPrice ?? item.price;
  if (raw == null || raw === "") {
    return undefined;
  }

  const normalized = String(raw).replace(/\s/g, "").replace(/\.00$/, "");
  const digits = normalized.replace(/[^\d]/g, "");
  if (!digits) {
    return undefined;
  }

  return `${Number(digits).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}

export function extractTildaImageUrl(item: {
  editions?: Array<{ img?: string }>;
  gallery?: string;
}): string | undefined {
  const editionImage = item.editions?.[0]?.img?.trim();
  if (editionImage) {
    return editionImage;
  }

  if (!item.gallery) {
    return undefined;
  }

  try {
    const gallery = JSON.parse(item.gallery) as Array<{ img?: string }>;
    return gallery[0]?.img ?? undefined;
  } catch {
    return undefined;
  }
}

export function toAbsoluteUrl(origin: URL, pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, origin).toString();
}
