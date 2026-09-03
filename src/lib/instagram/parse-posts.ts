import type { MediaType, Post } from "./types";

type RawCaptionEdge = {
  node?: {
    text?: string;
  };
};

type RawPostNode = {
  id?: string;
  shortcode?: string;
  display_url?: string;
  video_url?: string;
  is_video?: boolean;
  __typename?: string;
  taken_at_timestamp?: number;
  like_count?: number;
  comment_count?: number;
  edge_liked_by?: { count?: number };
  edge_media_to_comment?: { count?: number };
  edge_media_to_caption?: { edges?: RawCaptionEdge[] };
  caption?: { text?: string };
};

type RawTimelineEdge = {
  node?: RawPostNode;
};

type RawTimelineMedia = {
  edges?: RawTimelineEdge[];
};

type RawUser = {
  username?: string;
  is_verified?: boolean;
  profile_pic_url?: string;
  profile_pic_url_hd?: string;
  edge_owner_to_timeline_media?: RawTimelineMedia;
  xdt_api__v1__feed__user_timeline_graphql_connection?: RawTimelineMedia;
};

type ParsedProfilePayload = {
  user: RawUser;
  posts: RawPostNode[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectJsonValues(html: string): unknown[] {
  const values: unknown[] = [];
  const scriptPattern =
    /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const rawJson = match[1]?.trim();
    if (!rawJson) {
      continue;
    }

    try {
      values.push(JSON.parse(rawJson));
    } catch {
      continue;
    }
  }

  return values;
}

function extractTimelineEdges(value: unknown): RawTimelineEdge[] {
  const edges: RawTimelineEdge[] = [];

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }

    if (!isRecord(node)) {
      return;
    }

    if (Array.isArray(node.edges) && node.edges.every((edge) => isRecord(edge))) {
      for (const edge of node.edges) {
        if (isRecord(edge.node)) {
          edges.push(edge as RawTimelineEdge);
        }
      }
    }

    const timelineKeys = [
      "edge_owner_to_timeline_media",
      "xdt_api__v1__feed__user_timeline_graphql_connection",
    ] as const;

    for (const key of timelineKeys) {
      const timeline = node[key];
      if (isRecord(timeline) && Array.isArray(timeline.edges)) {
        for (const edge of timeline.edges) {
          if (isRecord(edge) && isRecord(edge.node)) {
            edges.push(edge as RawTimelineEdge);
          }
        }
      }
    }

    for (const nestedValue of Object.values(node)) {
      visit(nestedValue);
    }
  };

  visit(value);
  return edges;
}

function extractUser(value: unknown): RawUser | null {
  let found: RawUser | null = null;

  const visit = (node: unknown): void => {
    if (found || !isRecord(node)) {
      return;
    }

    if (
      typeof node.username === "string" &&
      (node.edge_owner_to_timeline_media !== undefined ||
        node.xdt_api__v1__feed__user_timeline_graphql_connection !== undefined ||
        node.profile_pic_url !== undefined ||
        node.profile_pic_url_hd !== undefined)
    ) {
      found = node as RawUser;
      return;
    }

    for (const nestedValue of Object.values(node)) {
      if (Array.isArray(nestedValue)) {
        for (const item of nestedValue) {
          visit(item);
        }
      } else {
        visit(nestedValue);
      }
    }
  };

  visit(value);
  return found;
}

function resolveMediaType(node: RawPostNode): MediaType {
  if (node.__typename === "GraphSidecar") {
    return "carousel";
  }

  if (node.__typename === "GraphVideo" || node.is_video) {
    return "video";
  }

  return "image";
}

function mapNodeToPost(
  node: RawPostNode,
  user: RawUser,
  username: string,
): Post | null {
  if (!node.id || !node.shortcode) {
    return null;
  }

  const mediaUrl = node.video_url ?? node.display_url;
  if (!mediaUrl) {
    return null;
  }

  const caption =
    node.edge_media_to_caption?.edges?.[0]?.node?.text ??
    node.caption?.text ??
    "";

  const likesCount = node.edge_liked_by?.count ?? node.like_count ?? 0;
  const commentsCount =
    node.edge_media_to_comment?.count ?? node.comment_count ?? 0;

  const postedAt =
    typeof node.taken_at_timestamp === "number"
      ? new Date(node.taken_at_timestamp * 1000).toISOString()
      : new Date(0).toISOString();

  return {
    id: node.id,
    username: user.username ?? username,
    avatarUrl: user.profile_pic_url_hd ?? user.profile_pic_url ?? "",
    isVerified: Boolean(user.is_verified),
    postedAt,
    mediaUrl,
    mediaType: resolveMediaType(node),
    likesCount,
    commentsCount,
    repostsCount: 0,
    caption,
    permalink: `https://www.instagram.com/p/${node.shortcode}/`,
  };
}

export function parseInstagramProfileHtml(
  html: string,
  username: string,
): ParsedProfilePayload {
  const jsonValues = collectJsonValues(html);
  const posts: RawPostNode[] = [];
  let user: RawUser | null = null;

  for (const value of jsonValues) {
    if (!user) {
      user = extractUser(value);
    }

    for (const edge of extractTimelineEdges(value)) {
      if (edge.node) {
        posts.push(edge.node);
      }
    }
  }

  if (!user && posts.length === 0) {
    throw new Error("Не удалось найти данные профиля в ответе Instagram");
  }

  return {
    user: user ?? { username },
    posts,
  };
}

export function mapPostsFromProfile(
  payload: ParsedProfilePayload,
  username: string,
  limit: number,
): Post[] {
  const seen = new Set<string>();
  const mapped: Post[] = [];

  for (const node of payload.posts) {
    const post = mapNodeToPost(node, payload.user, username);
    if (!post || seen.has(post.id)) {
      continue;
    }

    seen.add(post.id);
    mapped.push(post);

    if (mapped.length >= limit) {
      break;
    }
  }

  return mapped;
}
