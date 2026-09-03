import { afterEach, describe, expect, it, vi } from "vitest";

import { InstagramFetchError } from "@/lib/instagram";

const fetchLatestPostsMock = vi.fn();

vi.mock("@/lib/instagram", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/instagram")>();
  return {
    ...actual,
    fetchLatestPosts: (...args: Parameters<typeof actual.fetchLatestPosts>) =>
      fetchLatestPostsMock(...args),
  };
});

import { GET } from "@/app/api/posts/route";

afterEach(() => {
  fetchLatestPostsMock.mockReset();
});

describe("GET /api/posts", () => {
  it("возвращает 400, если query-параметр url отсутствует", async () => {
    const response = await GET(new Request("http://localhost/api/posts"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Обязательный query-параметр url отсутствует",
      code: "INVALID_URL",
    });
  });

  it("возвращает JSON-массив постов для валидного url", async () => {
    fetchLatestPostsMock.mockResolvedValue([
      {
        id: "post-image-1",
        username: "testcreator",
        avatarUrl: "https://cdn.example.com/avatar.jpg",
        isVerified: true,
        postedAt: "2024-01-01T00:00:00.000Z",
        mediaUrl: "https://cdn.example.com/posts/image-1.jpg",
        mediaType: "image",
        likesCount: 1200,
        commentsCount: 45,
        caption: "Первый пост с фото",
        permalink: "https://www.instagram.com/p/AbCdEfGhIjK/",
      },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/posts?url=https%3A%2F%2Fwww.instagram.com%2Ftestcreator%2F",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({
      username: "testcreator",
      mediaType: "image",
    });
    expect(fetchLatestPostsMock).toHaveBeenCalledWith(
      "https://www.instagram.com/testcreator/",
    );
  });

  it("возвращает понятную ошибку для невалидного url", async () => {
    fetchLatestPostsMock.mockRejectedValue(
      new InstagramFetchError(
        "Некорректный URL профиля Instagram",
        "INVALID_URL",
        400,
      ),
    );

    const response = await GET(
      new Request("http://localhost/api/posts?url=not-a-url"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("INVALID_URL");
    expect(body.error).toContain("Некорректный URL");
  });

  it("возвращает 404 для несуществующего профиля", async () => {
    fetchLatestPostsMock.mockRejectedValue(
      new InstagramFetchError(
        "Профиль @missing_user не найден",
        "NOT_FOUND",
        404,
      ),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/posts?url=https%3A%2F%2Fwww.instagram.com%2Fmissing_user%2F",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(body.error).toContain("missing_user");
  });
});
