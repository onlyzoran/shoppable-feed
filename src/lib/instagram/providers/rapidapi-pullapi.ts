import { InstagramFetchError } from "../errors";
import {
  mapRapidApiPosts,
  type RapidApiPostsPayload,
  type RapidApiProfile,
} from "../map-rapidapi-post";
import type { FetchFn, Post } from "../types";

type RapidApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type FetchRapidApiOptions = {
  fetch?: FetchFn;
  limit: number;
  rapidApiKey: string;
  rapidApiHost: string;
};

function buildRapidApiUrl(
  host: string,
  path: string,
  params: Record<string, string>,
): string {
  const url = new URL(`https://${host}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function rapidApiHeaders(apiKey: string, host: string): HeadersInit {
  return {
    Accept: "application/json",
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": host,
  };
}

async function readRapidApiJson<T>(
  response: Response,
): Promise<RapidApiEnvelope<T>> {
  try {
    return (await response.json()) as RapidApiEnvelope<T>;
  } catch {
    throw new InstagramFetchError(
      "Не удалось разобрать ответ RapidAPI",
      "PARSE_ERROR",
      502,
    );
  }
}

function isNotFoundMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("not found") ||
    normalized.includes("doesn't exist") ||
    normalized.includes("does not exist") ||
    normalized.includes("user not found") ||
    normalized.includes("private account")
  );
}

async function fetchRapidApiProfile(
  username: string,
  options: FetchRapidApiOptions,
): Promise<RapidApiProfile> {
  const fetchImpl = options.fetch ?? fetch;
  const url = buildRapidApiUrl(options.rapidApiHost, "/instagram/profile", {
    username,
  });

  let response: Response;

  try {
    response = await fetchImpl(url, {
      headers: rapidApiHeaders(options.rapidApiKey, options.rapidApiHost),
    });
  } catch {
    throw new InstagramFetchError(
      "Не удалось обратиться к RapidAPI",
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
      `RapidAPI вернул статус ${response.status}`,
      "FETCH_ERROR",
      502,
    );
  }

  const envelope = await readRapidApiJson<RapidApiProfile>(response);

  if (envelope.success === false) {
    const message = envelope.error ?? envelope.message ?? "RapidAPI error";
    if (isNotFoundMessage(message)) {
      throw new InstagramFetchError(
        `Профиль @${username} не найден`,
        "NOT_FOUND",
        404,
      );
    }

    throw new InstagramFetchError(message, "FETCH_ERROR", 502);
  }

  return envelope.data ?? { username };
}

export async function fetchLatestPostsRapidApi(
  username: string,
  options: FetchRapidApiOptions,
): Promise<Post[]> {
  const fetchImpl = options.fetch ?? fetch;
  const url = buildRapidApiUrl(options.rapidApiHost, "/instagram/posts", {
    username,
    limit: String(options.limit),
  });

  let response: Response;

  try {
    response = await fetchImpl(url, {
      headers: rapidApiHeaders(options.rapidApiKey, options.rapidApiHost),
    });
  } catch {
    throw new InstagramFetchError(
      "Не удалось обратиться к RapidAPI",
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
      `RapidAPI вернул статус ${response.status}`,
      "FETCH_ERROR",
      502,
    );
  }

  const envelope = await readRapidApiJson<RapidApiPostsPayload>(response);

  if (envelope.success === false) {
    const message = envelope.error ?? envelope.message ?? "RapidAPI error";
    if (isNotFoundMessage(message)) {
      throw new InstagramFetchError(
        `Профиль @${username} не найден`,
        "NOT_FOUND",
        404,
      );
    }

    throw new InstagramFetchError(message, "FETCH_ERROR", 502);
  }

  const payload = envelope.data;
  if (!payload) {
    throw new InstagramFetchError(
      "RapidAPI вернул пустой ответ",
      "FETCH_ERROR",
      502,
    );
  }

  let profile: RapidApiProfile = { username: payload.username ?? username };

  try {
    profile = await fetchRapidApiProfile(username, options);
  } catch (error) {
    if (error instanceof InstagramFetchError && error.code === "NOT_FOUND") {
      throw error;
    }
  }

  const posts = mapRapidApiPosts(payload, profile, username, options.limit);

  if (posts.length === 0) {
    throw new InstagramFetchError(
      `У профиля @${username} нет доступных постов`,
      "NOT_FOUND",
      404,
    );
  }

  return posts;
}
