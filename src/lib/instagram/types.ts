export type MediaType = "image" | "video" | "carousel";

export type Post = {
  id: string;
  username: string;
  avatarUrl: string;
  isVerified: boolean;
  postedAt: string;
  mediaUrl: string;
  mediaType: MediaType;
  likesCount: number;
  commentsCount: number;
  caption: string;
  permalink: string;
};

export type FetchFn = typeof fetch;

export type FetchLatestPostsOptions = {
  fetch?: FetchFn;
  limit?: number;
};
