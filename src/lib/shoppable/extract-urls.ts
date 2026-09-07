const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)]+$/;

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(TRAILING_PUNCTUATION, "");
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function isInstagramInternalUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname === "instagram.com" || hostname.endsWith(".instagram.com");
  } catch {
    return false;
  }
}

export function extractUrlsFromText(text: string): string[] {
  if (!text.trim()) {
    return [];
  }

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const match of text.matchAll(URL_PATTERN)) {
    const normalized = normalizeUrl(match[0]);
    if (!normalized || seen.has(normalized) || isInstagramInternalUrl(normalized)) {
      continue;
    }

    seen.add(normalized);
    urls.push(normalized);
  }

  return urls;
}

export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();

  for (const match of text.matchAll(/#([\p{L}\p{N}_]+)/gu)) {
    tags.add(match[1].toLowerCase());
  }

  return [...tags];
}
