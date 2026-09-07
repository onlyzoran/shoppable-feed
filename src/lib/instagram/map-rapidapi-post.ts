import type { MediaType, Post } from "./types";

export type RapidApiProfile = {
  username?: string;
  is_verified?: boolean;
  profile_pic_url?: string;
  profile_pic_url_hd?: string;
  biography?: string;
  external_url?: string;
};

export type RapidApiPost = {
  post_id?: string;
  shortcode?: string;
  post_type?: string;
  caption?: string;
  like_count?: number;
  comment_count?: number;
  timestamp?: number;
  display_url?: string;
  video_url?: string | null;
  is_video?: boolean;
  carousel_media?: unknown[] | null;
};

export type RapidApiPostsPayload = {
  username?: string;
  posts?: RapidApiPost[];
};

function resolveMediaType(post: RapidApiPost): MediaType {
  if (post.post_type === "carousel" || (post.carousel_media?.length ?? 0) > 0) {
    return "carousel";
  }

  if (post.post_type === "video" || post.is_video || post.video_url) {
    return "video";
  }

  return "image";
}

export function mapRapidApiPostToPost(
  post: RapidApiPost,
  profile: RapidApiProfile,
  username: string,
): Post | null {
  const id = post.post_id ?? post.shortcode;
  const shortcode = post.shortcode;

  if (!id || !shortcode) {
    return null;
  }

  const mediaUrl = post.video_url ?? post.display_url;
  if (!mediaUrl) {
    return null;
  }

  const postedAt =
    typeof post.timestamp === "number"
      ? new Date(post.timestamp * 1000).toISOString()
      : new Date(0).toISOString();

  const profileUsername = profile.username ?? username;
  const externalUrl = profile.external_url?.trim() ?? "";

  return {
    id,
    username: profileUsername,
    avatarUrl: profile.profile_pic_url_hd ?? profile.profile_pic_url ?? "",
    isVerified: Boolean(profile.is_verified),
    postedAt,
    mediaUrl,
    mediaType: resolveMediaType(post),
    likesCount: post.like_count ?? 0,
    commentsCount: post.comment_count ?? 0,
    repostsCount: 0,
    caption: post.caption ?? "",
    permalink: `https://www.instagram.com/p/${shortcode}/`,
    profileBio: profile.biography ?? "",
    profileExternalUrl: externalUrl,
    profileLinks: externalUrl ? [externalUrl] : [],
  };
}

export function mapRapidApiPosts(
  payload: RapidApiPostsPayload,
  profile: RapidApiProfile,
  username: string,
  limit: number,
): Post[] {
  const seen = new Set<string>();
  const mapped: Post[] = [];

  for (const post of payload.posts ?? []) {
    const mappedPost = mapRapidApiPostToPost(post, profile, username);
    if (!mappedPost || seen.has(mappedPost.id)) {
      continue;
    }

    seen.add(mappedPost.id);
    mapped.push(mappedPost);

    if (mapped.length >= limit) {
      break;
    }
  }

  return mapped;
}
