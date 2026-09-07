export type InstagramFetchMode = "direct" | "rapidapi" | "auto";

export const DEFAULT_RAPIDAPI_HOST = "instagram-scraper-api14.p.rapidapi.com";

const VALID_MODES = new Set<InstagramFetchMode>(["direct", "rapidapi", "auto"]);

export type InstagramFetchConfig = {
  mode: InstagramFetchMode;
  rapidApiKey: string | undefined;
  rapidApiHost: string;
};

export type InstagramFetchConfigOverrides = {
  fetchMode?: InstagramFetchMode;
  rapidApiKey?: string;
  rapidApiHost?: string;
};

function parseFetchMode(raw: string | undefined): InstagramFetchMode {
  const normalized = raw?.trim().toLowerCase();

  if (!normalized) {
    return "auto";
  }

  if (VALID_MODES.has(normalized as InstagramFetchMode)) {
    return normalized as InstagramFetchMode;
  }

  return "auto";
}

export function resolveInstagramFetchConfig(
  overrides: InstagramFetchConfigOverrides = {},
): InstagramFetchConfig {
  const mode = overrides.fetchMode ?? parseFetchMode(process.env.INSTAGRAM_FETCH_MODE);

  const rapidApiKey =
    overrides.rapidApiKey ??
    (process.env.RAPIDAPI_KEY?.trim() || undefined);

  const rapidApiHost =
    overrides.rapidApiHost ??
    (process.env.RAPIDAPI_HOST?.trim() || DEFAULT_RAPIDAPI_HOST);

  return {
    mode,
    rapidApiKey,
    rapidApiHost,
  };
}
