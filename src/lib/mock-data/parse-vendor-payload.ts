import type { Post } from "@/lib/instagram/types";

import type {
  ParsedVendorPost,
  VendorMedia,
  VendorPayload,
  VendorPost,
} from "./types";

function extractShortcode(link: string): string {
  const match = link.match(/\/p\/([^/?#]+)/);
  return match?.[1] ?? link;
}

function resolveMediaUrls(
  media: VendorMedia | undefined,
): { mediaUrl: string; mediaPosterUrl?: string } | null {
  if (!media) {
    return null;
  }

  if (media.type === "video") {
    const posterUrl = media.cover?.thumbnail?.url;
    const videoUrl = media.url;

    if (!posterUrl && !videoUrl) {
      return null;
    }

    return {
      mediaUrl: videoUrl ?? posterUrl!,
      mediaPosterUrl: posterUrl,
    };
  }

  const imageUrl = media.thumbnail?.url;
  if (!imageUrl) {
    return null;
  }

  return { mediaUrl: imageUrl };
}

function resolveMediaType(post: VendorPost): Post["mediaType"] {
  if (post.type === "reel") {
    return "video";
  }

  if (post.type === "album" || (post.media?.length ?? 0) > 1) {
    return "carousel";
  }

  const firstMedia = post.media?.[0];
  if (firstMedia?.type === "video") {
    return "video";
  }

  return "image";
}

function mapVendorPost(post: VendorPost, fallbackUsername: string): ParsedVendorPost | null {
  const media = resolveMediaUrls(post.media?.[0]);
  const link = post.link?.trim();

  if (!post.vendorId || !media || !link) {
    return null;
  }

  const mediaType = resolveMediaType(post);
  let { mediaUrl, mediaPosterUrl } = media;

  // Carousel preview must be an image; video slides store mp4 in mediaUrl.
  if (
    mediaType === "carousel" &&
    post.media?.[0]?.type === "video" &&
    mediaPosterUrl
  ) {
    mediaUrl = mediaPosterUrl;
  }

  const author = post.author ?? {};
  const profileUrl = author.url?.trim() ?? "";

  return {
    id: post.vendorId,
    username: author.username ?? fallbackUsername,
    avatarUrl: author.profilePictureUrl ?? "",
    isVerified: Boolean(author.isVerifiedProfile),
    postedAt: post.publishedAt ?? new Date(0).toISOString(),
    mediaUrl,
    mediaPosterUrl,
    mediaType,
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    repostsCount: post.shareCount ?? 0,
    caption: post.caption ?? "",
    permalink: link,
    profileBio: author.biography?.trim() ?? "",
    profileExternalUrl: profileUrl,
    profileLinks: profileUrl ? [profileUrl] : [],
  };
}

export function mapVendorPayloadToPosts(
  payload: VendorPayload,
  username: string,
  limit: number,
): Post[] {
  const posts = payload.payload ?? [];
  const seen = new Set<string>();
  const mapped: Post[] = [];

  for (const post of posts) {
    const mappedPost = mapVendorPost(post, username);
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

export function extractShortcodeFromLink(link: string): string {
  return extractShortcode(link);
}
