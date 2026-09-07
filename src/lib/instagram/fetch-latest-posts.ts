import { resolveInstagramFetchConfig } from "./config";
import { fetchLatestPostsDirect } from "./fetch-direct";
import { InstagramFetchError } from "./errors";
import { parseInstagramProfileUrl } from "./parse-profile-url";
import { fetchLatestPostsRapidApi } from "./providers/rapidapi-pullapi";
import type { FetchLatestPostsOptions, Post } from "./types";

const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 10;
const MAX_LIMIT = 20;

function resolveLimit(limit?: number): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
}

function isFallbackEligible(error: unknown): boolean {
  return (
    error instanceof InstagramFetchError &&
    error.fallbackEligible === true
  );
}

function missingRapidApiKeyError(): InstagramFetchError {
  return new InstagramFetchError(
    "RAPIDAPI_KEY не настроен для резервного источника Instagram",
    "FETCH_ERROR",
    502,
  );
}

function bothSourcesFailedError(): InstagramFetchError {
  return new InstagramFetchError(
    "Не удалось загрузить посты: Instagram недоступен, резервный источник (RapidAPI) также не ответил",
    "FETCH_ERROR",
    502,
  );
}

async function fetchViaRapidApi(
  username: string,
  limit: number,
  options: FetchLatestPostsOptions,
): Promise<Post[]> {
  const config = resolveInstagramFetchConfig(options);

  if (!config.rapidApiKey) {
    throw missingRapidApiKeyError();
  }

  return fetchLatestPostsRapidApi(username, {
    fetch: options.fetch,
    limit,
    rapidApiKey: config.rapidApiKey,
    rapidApiHost: config.rapidApiHost,
  });
}

export async function fetchLatestPosts(
  profileUrl: string,
  options: FetchLatestPostsOptions = {},
): Promise<Post[]> {
  let username: string;

  try {
    username = parseInstagramProfileUrl(profileUrl);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Некорректный URL профиля Instagram";
    throw new InstagramFetchError(message, "INVALID_URL", 400);
  }

  const config = resolveInstagramFetchConfig(options);
  const limit = resolveLimit(options.limit);

  if (config.mode === "rapidapi") {
    return fetchViaRapidApi(username, limit, options);
  }

  if (config.mode === "direct") {
    return fetchLatestPostsDirect(username, { fetch: options.fetch, limit });
  }

  try {
    return await fetchLatestPostsDirect(username, {
      fetch: options.fetch,
      limit,
    });
  } catch (directError) {
    if (!isFallbackEligible(directError)) {
      throw directError;
    }

    try {
      return await fetchViaRapidApi(username, limit, options);
    } catch (rapidApiError) {
      if (
        rapidApiError instanceof InstagramFetchError &&
        rapidApiError.code !== "FETCH_ERROR"
      ) {
        throw rapidApiError;
      }

      if (!config.rapidApiKey) {
        throw missingRapidApiKeyError();
      }

      throw bothSourcesFailedError();
    }
  }
}
