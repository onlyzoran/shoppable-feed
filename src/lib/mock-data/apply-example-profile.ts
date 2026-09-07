import type { Post } from "@/lib/instagram/types";

import type { ExampleSource } from "./types";

export function applyExampleProfile(
  posts: Post[],
  example: ExampleSource,
): Post[] {
  const hasOverrides =
    example.profileBio !== undefined ||
    example.profileExternalUrl !== undefined ||
    example.profileLinks !== undefined;

  if (!hasOverrides) {
    return posts;
  }

  return posts.map((post) => ({
    ...post,
    username: example.id,
    profileBio: example.profileBio ?? post.profileBio,
    profileExternalUrl: example.profileExternalUrl ?? post.profileExternalUrl,
    profileLinks: example.profileLinks ?? post.profileLinks,
  }));
}
