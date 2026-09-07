import type { MediaType } from "@/lib/instagram/types";

export type ExampleSource = {
  id: string;
  label: string;
  profileUrl: string;
  /** Если указан — посты берутся из mock-data, иначе — live Instagram */
  fileName?: string;
  profileBio?: string;
  profileExternalUrl?: string;
  profileLinks?: string[];
};

export type VendorMediaImage = {
  type: "image";
  thumbnail?: {
    url?: string;
  };
};

export type VendorMediaVideo = {
  type: "video";
  url?: string;
  cover?: {
    thumbnail?: {
      url?: string;
    };
  };
};

export type VendorMedia = VendorMediaImage | VendorMediaVideo;

export type VendorAuthor = {
  username?: string;
  profilePictureUrl?: string;
  isVerifiedProfile?: boolean;
  name?: string;
  biography?: string | null;
  url?: string | null;
};

export type VendorPost = {
  vendorId?: string;
  type?: string;
  link?: string;
  publishedAt?: string;
  author?: VendorAuthor;
  media?: VendorMedia[];
  caption?: string;
  commentsCount?: number;
  likesCount?: number;
  shareCount?: number | null;
};

export type VendorPayload = {
  payload?: VendorPost[];
};

export type ParsedVendorPost = {
  id: string;
  username: string;
  avatarUrl: string;
  isVerified: boolean;
  postedAt: string;
  mediaUrl: string;
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
