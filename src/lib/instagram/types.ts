export type MediaType = "image" | "video" | "carousel";

export type Post = {
  id: string;
  username: string;
  avatarUrl: string;
  isVerified: boolean;
  postedAt: string;
  mediaUrl: string;
  /** Для video/reels — статичный кадр для превью в ленте 4:5 */
  mediaPosterUrl?: string;
  mediaType: MediaType;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  caption: string;
  permalink: string;
  profileBio: string;
  profileExternalUrl: string;
  profileLinks: string[];
};

export type FetchFn = typeof fetch;

export type FetchLatestPostsOptions = {
  fetch?: FetchFn;
  limit?: number;
};
