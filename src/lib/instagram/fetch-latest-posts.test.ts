import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { fetchLatestPosts } from "./fetch-latest-posts";
import { InstagramFetchError } from "./errors";
import { parseInstagramProfileUrl } from "./parse-profile-url";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

function mockFetch(response: {
  status?: number;
  body: string;
}): typeof fetch {
  return async () =>
    new Response(response.body, {
      status: response.status ?? 200,
      headers: { "Content-Type": "text/html" },
    });
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

describe("fetchLatestPosts", () => {
  it("возвращает 10–12 постов из HTML-фикстуры без live HTTP", async () => {
    const posts = await fetchLatestPosts(
      "https://www.instagram.com/testcreator/",
      {
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

  it("возвращает INVALID_URL для некорректной ссылки", async () => {
    await expect(
      fetchLatestPosts("https://example.com/not-instagram"),
    ).rejects.toMatchObject({
      code: "INVALID_URL",
      statusCode: 400,
      message: "URL должен вести на instagram.com",
    } satisfies Partial<InstagramFetchError>);
  });

  it("возвращает NOT_FOUND, если профиль отсутствует", async () => {
    await expect(
      fetchLatestPosts("https://www.instagram.com/missing_user/", {
        fetch: mockFetch({ body: readFixture("profile-not-found.html") }),
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
      message: "Профиль @missing_user не найден",
    } satisfies Partial<InstagramFetchError>);
  });

  it("возвращает NOT_FOUND при HTTP 404", async () => {
    await expect(
      fetchLatestPosts("https://www.instagram.com/missing_user/", {
        fetch: mockFetch({ status: 404, body: "Not Found" }),
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    } satisfies Partial<InstagramFetchError>);
  });
});
