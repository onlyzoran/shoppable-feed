const FAKE_SHORTCODE_PATTERN =
  /\/p\/(?:MadjMock|DropsMock|CityNails|ChopChop|LimeStore|Storeez|GoldApple|Podrygka|LevelTravel|CoralTravel|PachkaCoffee|CodeRed|AsyaDrop)\d+/i;

export function isRealInstagramPermalink(link) {
  if (!link.includes("instagram.com/p/")) {
    return false;
  }

  return !FAKE_SHORTCODE_PATTERN.test(link);
}

export function assertRealInstagramMock(payload, label) {
  const posts = payload.payload ?? [];

  if (posts.length === 0) {
    throw new Error(`Example «${label}»: empty payload`);
  }

  for (const post of posts) {
    if (!post.link || !isRealInstagramPermalink(post.link)) {
      throw new Error(
        `Example «${label}»: fake or missing permalink ${post.link ?? "(none)"}`,
      );
    }

    const mediaUrl = post.media?.[0]?.thumbnail?.url ?? post.media?.[0]?.url;
    if (!mediaUrl || mediaUrl.includes("picsum.photos")) {
      throw new Error(`Example «${label}»: placeholder media in ${post.link}`);
    }
  }
}
