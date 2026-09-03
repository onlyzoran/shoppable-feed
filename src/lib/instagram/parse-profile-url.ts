const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

const USERNAME_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

export function parseInstagramProfileUrl(profileUrl: string): string {
  let parsed: URL;

  try {
    parsed = new URL(profileUrl.trim());
  } catch {
    throw new Error("Некорректный URL профиля Instagram");
  }

  if (!INSTAGRAM_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("URL должен вести на instagram.com");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    throw new Error(
      "Укажите ссылку на профиль вида https://www.instagram.com/<username>/",
    );
  }

  const firstSegment = segments[0].toLowerCase();
  const reservedPaths = new Set([
    "p",
    "reel",
    "reels",
    "stories",
    "explore",
    "accounts",
    "direct",
    "about",
  ]);

  if (reservedPaths.has(firstSegment)) {
    throw new Error(
      "Ссылка должна указывать на профиль пользователя, а не на раздел Instagram",
    );
  }

  if (segments.length !== 1) {
    throw new Error(
      "Укажите ссылку на профиль вида https://www.instagram.com/<username>/",
    );
  }

  const username = firstSegment;

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Имя пользователя в URL имеет недопустимый формат");
  }

  return username;
}

export function normalizeInstagramProfileUrl(username: string): string {
  return `https://www.instagram.com/${username}/`;
}
