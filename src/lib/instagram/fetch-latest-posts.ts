import { InstagramFetchError } from "./errors";
import {
  mapPostsFromProfile,
  parseInstagramProfileHtml,
} from "./parse-posts";
import {
  normalizeInstagramProfileUrl,
  parseInstagramProfileUrl,
} from "./parse-profile-url";
import type { FetchLatestPostsOptions, FetchFn, Post } from "./types";

const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 10;
const MAX_LIMIT = 20;

function resolveLimit(limit?: number): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
}

function isNotFoundHtml(html: string): boolean {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("sorry, this page isn't available") ||
    normalized.includes("page not found") ||
    normalized.includes('"user":null') ||
    normalized.includes('"user": null')
  );
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

  const fetchImpl: FetchFn = options.fetch ?? fetch;
  const limit = resolveLimit(options.limit);
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
    throw new InstagramFetchError(
      "Не удалось загрузить профиль Instagram",
      "FETCH_ERROR",
      502,
    );
  }

  if (response.status === 404) {
    throw new InstagramFetchError(
      `Профиль @${username} не найден`,
      "NOT_FOUND",
      404,
    );
  }

  if (!response.ok) {
    throw new InstagramFetchError(
      `Instagram вернул статус ${response.status}`,
      "FETCH_ERROR",
      502,
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

  const posts = mapPostsFromProfile(payload, username, limit);

  if (posts.length === 0) {
    throw new InstagramFetchError(
      `У профиля @${username} нет доступных постов`,
      "NOT_FOUND",
      404,
    );
  }

  return posts;
}
