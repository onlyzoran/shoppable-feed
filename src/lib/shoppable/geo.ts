const PIN_PATTERN = /📍\s*([^\n#@]+)/u;
const CITY_PATTERN =
  /\b(?:г\.?\s*)?([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)\b/u;

export function extractGeoFromCaption(caption: string): string | null {
  const trimmed = caption.trim();
  if (!trimmed) {
    return null;
  }

  const pinMatch = trimmed.match(PIN_PATTERN);
  if (pinMatch?.[1]) {
    const geo = pinMatch[1].trim().replace(/[,.]$/, "");
    if (geo.length >= 2) {
      return geo;
    }
  }

  const cityMatch = trimmed.match(CITY_PATTERN);
  if (cityMatch?.[1]) {
    return cityMatch[1].trim();
  }

  return null;
}

export function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildWebSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
