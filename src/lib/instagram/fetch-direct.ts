import { InstagramFetchError } from "./errors";
import {
  mapPostsFromProfile,
  parseInstagramProfileHtml,
} from "./parse-posts";
import { normalizeInstagramProfileUrl } from "./parse-profile-url";
import type { FetchFn, Post } from "./types";

function isNotFoundHtml(html: string): boolean {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("sorry, this page isn't available") ||
    normalized.includes("page not found") ||
    normalized.includes('"user":null') ||
    normalized.includes('"user": null')
  );
}

function createFetchError(
  message: string,
  fallbackEligible: boolean,
): InstagramFetchError {
  const error = new InstagramFetchError(message, "FETCH_ERROR", 502);
  error.fallbackEligible = fallbackEligible;
  return error;
}

export type FetchDirectOptions = {
  fetch?: FetchFn;
  limit: number;
};

export async function fetchLatestPostsDirect(
  username: string,
  options: FetchDirectOptions,
): Promise<Post[]> {
  const fetchImpl: FetchFn = options.fetch ?? fetch;
  const normalizedUrl = normalizeInstagramProfileUrl(username);

  let response: Response;

  try {
    response = await fetchImpl(normalizedUrl, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (compatible; ShoppableFeedBot/1.0; +https://github.com/onlyzoran/shoppable-feed)",
      },
    });
  } catch {
    throw createFetchError("Не удалось загрузить профиль Instagram", true);
  }

  if (response.status === 404) {
    throw new InstagramFetchError(
      `Профиль @${username} не найден`,
      "NOT_FOUND",
      404,
    );
  }

  if (response.status === 429 || response.status >= 500) {
    throw createFetchError(
      `Instagram вернул статус ${response.status}`,
      true,
    );
  }

  if (!response.ok) {
    throw createFetchError(
      `Instagram вернул статус ${response.status}`,
      false,
    );
  }

  const html = await response.text();

  if (isNotFoundHtml(html)) {
    throw new InstagramFetchError(
      `Профиль @${username} не найден`,
      "NOT_FOUND",
      404,
    );
  }

  let payload;

  try {
    payload = parseInstagramProfileHtml(html, username);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось разобрать ответ Instagram";
    throw new InstagramFetchError(message, "PARSE_ERROR", 502);
  }

  const posts = mapPostsFromProfile(payload, username, options.limit);

  if (posts.length === 0) {
    throw new InstagramFetchError(
      `У профиля @${username} нет доступных постов`,
      "NOT_FOUND",
      404,
    );
  }

  return posts;
}
