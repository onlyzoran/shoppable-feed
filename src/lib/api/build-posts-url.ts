/** Относительный URL — корректно работает с basePath (/shoppable-feed) на prod и preview. */
export function buildPostsApiUrl(profileUrl: string): string {
  const params = new URLSearchParams({ url: profileUrl.trim() });
  return `api/posts?${params.toString()}`;
}
