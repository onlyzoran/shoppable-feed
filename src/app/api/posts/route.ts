import { NextResponse } from "next/server";

import {
  fetchLatestPosts,
  InstagramFetchError,
} from "@/lib/instagram";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileUrl = searchParams.get("url");

  if (!profileUrl) {
    return NextResponse.json(
      {
        error: "Обязательный query-параметр url отсутствует",
        code: "INVALID_URL",
      },
      { status: 400 },
    );
  }

  try {
    const posts = await fetchLatestPosts(profileUrl);
    return NextResponse.json(posts);
  } catch (error) {
    if (error instanceof InstagramFetchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "Внутренняя ошибка при загрузке постов",
        code: "FETCH_ERROR",
      },
      { status: 500 },
    );
  }
}
