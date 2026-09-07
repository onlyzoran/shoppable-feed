import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { fetchLatestPosts } from "./fetch-latest-posts";
import { InstagramFetchError } from "./errors";
import { mapRapidApiPostToPost } from "./map-rapidapi-post";
import { parseInstagramProfileUrl } from "./parse-profile-url";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

function readJsonFixture<T>(name: string): T {
  return JSON.parse(readFixture(name)) as T;
}

function mockFetch(response: {
  status?: number;
  body: string;
  contentType?: string;
}): typeof fetch {
  return async () =>
    new Response(response.body, {
      status: response.status ?? 200,
      headers: {
        "Content-Type": response.contentType ?? "text/html",
      },
    });
}

function mockRapidApiFetch(fixtures: {
  posts?: string;
  profile?: string;
  postsStatus?: number;
  profileStatus?: number;
}): typeof fetch {
  const postsBody = fixtures.posts ?? readFixture("rapidapi-posts-success.json");
  const profileBody =
    fixtures.profile ?? readFixture("rapidapi-profile-success.json");

  return async (input) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/instagram/posts")) {
      return new Response(postsBody, {
        status: fixtures.postsStatus ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.includes("/instagram/profile")) {
      return new Response(profileBody, {
        status: fixtures.profileStatus ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  };
}

function routingFetch(handlers: {
  instagram?: typeof fetch;
  rapidapi?: typeof fetch;
}): typeof fetch {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("instagram.com")) {
      const handler = handlers.instagram ?? mockFetch({ status: 429, body: "" });
      return handler(input, init);
    }

    if (url.includes("rapidapi.com")) {
      const handler =
        handlers.rapidapi ?? mockRapidApiFetch({});
      return handler(input, init);
    }

    return new Response("Not Found", { status: 404 });
  };
}

describe("parseInstagramProfileUrl", () => {
  it("извлекает username из валидного URL профиля", () => {
    expect(
      parseInstagramProfileUrl("https://www.instagram.com/testcreator/"),
    ).toBe("testcreator");
    expect(parseInstagramProfileUrl("https://instagram.com/TestCreator")).toBe(
      "testcreator",
    );
  });

  it("возвращает понятную ошибку для невалидного URL", () => {
    expect(() => parseInstagramProfileUrl("not-a-url")).toThrow(
      "Некорректный URL профиля Instagram",
    );
    expect(() =>
      parseInstagramProfileUrl("https://twitter.com/testcreator/"),
    ).toThrow("URL должен вести на instagram.com");
    expect(() =>
      parseInstagramProfileUrl("https://www.instagram.com/p/AbCdEf/"),
    ).toThrow("Ссылка должна указывать на профиль пользователя");
    expect(() =>
      parseInstagramProfileUrl("https://www.instagram.com/user/extra/"),
    ).toThrow("Укажите ссылку на профиль");
  });
});

describe("mapRapidApiPostToPost", () => {
  it("корректно определяет mediaType для image, video и carousel", () => {
    const profile = readJsonFixture<{ data: Record<string, unknown> }>(
      "rapidapi-profile-success.json",
    ).data;

    const posts = readJsonFixture<{ data: { posts: Record<string, unknown>[] } }>(
      "rapidapi-posts-success.json",
    ).data.posts;

    expect(
      mapRapidApiPostToPost(posts[0], profile, "natgeo")?.mediaType,
    ).toBe("image");
    expect(
      mapRapidApiPostToPost(posts[1], profile, "natgeo")?.mediaType,
    ).toBe("video");
    expect(
      mapRapidApiPostToPost(posts[2], profile, "natgeo")?.mediaType,
    ).toBe("carousel");
  });
});

describe("fetchLatestPosts", () => {
  it("в режиме direct возвращает 10–12 постов из HTML-фикстуры без live HTTP", async () => {
    const posts = await fetchLatestPosts(
      "https://www.instagram.com/testcreator/",
      {
        fetchMode: "direct",
        fetch: mockFetch({ body: readFixture("profile-success.html") }),
      },
    );

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts.length).toBeLessThanOrEqual(12);

    expect(posts[0]).toMatchObject({
      id: "post-image-1",
      username: "testcreator",
      avatarUrl: "https://cdn.example.com/avatar.jpg",
      isVerified: true,
      mediaType: "image",
      likesCount: 1200,
      commentsCount: 45,
      caption: "Первый пост с фото",
      permalink: "https://www.instagram.com/p/AbCdEfGhIjK/",
    });

    const videoPost = posts.find((post) => post.id === "post-video-2");
    expect(videoPost).toMatchObject({
      mediaType: "video",
      mediaUrl: "https://cdn.example.com/posts/video-2.mp4",
    });

    const carouselPost = posts.find((post) => post.id === "post-carousel-3");
    expect(carouselPost).toMatchObject({
      mediaType: "carousel",
    });
  });

  it("в режиме rapidapi возвращает посты из JSON-фикстуры", async () => {
    const posts = await fetchLatestPosts(
      "https://www.instagram.com/natgeo/",
      {
        fetchMode: "rapidapi",
        rapidApiKey: "test-key",
        fetch: mockRapidApiFetch({}),
      },
    );

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0]).toMatchObject({
      id: "rapid-image-1",
      username: "natgeo",
      avatarUrl: "https://cdn.example.com/natgeo-avatar-hd.jpg",
      isVerified: true,
      mediaType: "image",
      likesCount: 1250000,
      commentsCount: 4500,
      caption: "Northern Lights over Iceland",
      permalink: "https://www.instagram.com/p/RapidImg001/",
    });
  });

  it("в режиме auto переключается на RapidAPI при 429 от direct", async () => {
    const posts = await fetchLatestPosts(
      "https://www.instagram.com/natgeo/",
      {
        fetchMode: "auto",
        rapidApiKey: "test-key",
        fetch: routingFetch({
          instagram: mockFetch({ status: 429, body: "Rate limited" }),
          rapidapi: mockRapidApiFetch({}),
        }),
      },
    );

    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(posts[0].username).toBe("natgeo");
    expect(posts[0].id).toBe("rapid-image-1");
  });

  it("в режиме auto переключается на RapidAPI при сетевой ошибке direct", async () => {
    const networkErrorFetch: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("instagram.com")) {
        throw new TypeError("fetch failed");
      }
      return mockRapidApiFetch({})(input);
    };

    const posts = await fetchLatestPosts(
      "https://www.instagram.com/natgeo/",
      {
        fetchMode: "auto",
        rapidApiKey: "test-key",
        fetch: networkErrorFetch,
      },
    );

    expect(posts[0].id).toBe("rapid-image-1");
  });

  it("в режиме auto возвращает FETCH_ERROR, если оба источника недоступны", async () => {
    const bothFailFetch: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("instagram.com")) {
        return new Response("Server Error", { status: 503 });
      }

      return new Response("Service Unavailable", { status: 503 });
    };

    await expect(
      fetchLatestPosts("https://www.instagram.com/natgeo/", {
        fetchMode: "auto",
        rapidApiKey: "test-key",
        fetch: bothFailFetch,
      }),
    ).rejects.toMatchObject({
      code: "FETCH_ERROR",
      statusCode: 502,
      message: expect.stringContaining("резервный источник"),
    } satisfies Partial<InstagramFetchError>);
  });

  it("в режиме rapidapi возвращает NOT_FOUND для отсутствующего профиля", async () => {
    await expect(
      fetchLatestPosts("https://www.instagram.com/missing_user/", {
        fetchMode: "rapidapi",
        rapidApiKey: "test-key",
        fetch: mockRapidApiFetch({
          posts: readFixture("rapidapi-not-found.json"),
          postsStatus: 200,
        }),
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
      message: "Профиль @missing_user не найден",
    } satisfies Partial<InstagramFetchError>);
  });

  it("возвращает INVALID_URL для некорректной ссылки", async () => {
    await expect(
      fetchLatestPosts("https://example.com/not-instagram"),
    ).rejects.toMatchObject({
      code: "INVALID_URL",
      statusCode: 400,
      message: "URL должен вести на instagram.com",
    } satisfies Partial<InstagramFetchError>);
  });

  it("в режиме direct возвращает NOT_FOUND, если профиль отсутствует", async () => {
    await expect(
      fetchLatestPosts("https://www.instagram.com/missing_user/", {
        fetchMode: "direct",
        fetch: mockFetch({ body: readFixture("profile-not-found.html") }),
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
      message: "Профиль @missing_user не найден",
    } satisfies Partial<InstagramFetchError>);
  });

  it("в режиме direct возвращает NOT_FOUND при HTTP 404", async () => {
    await expect(
      fetchLatestPosts("https://www.instagram.com/missing_user/", {
        fetchMode: "direct",
        fetch: mockFetch({ status: 404, body: "Not Found" }),
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    } satisfies Partial<InstagramFetchError>);
  });

  it("в режиме auto не делает fallback при NOT_FOUND от direct", async () => {
    let rapidApiCalled = false;

    const fetchImpl: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("rapidapi.com")) {
        rapidApiCalled = true;
        return mockRapidApiFetch({})(input);
      }

      return new Response(readFixture("profile-not-found.html"), {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    };

    await expect(
      fetchLatestPosts("https://www.instagram.com/missing_user/", {
        fetchMode: "auto",
        rapidApiKey: "test-key",
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    } satisfies Partial<InstagramFetchError>);

    expect(rapidApiCalled).toBe(false);
  });
});
