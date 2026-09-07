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
