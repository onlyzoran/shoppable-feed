import type { MediaType, Post } from "@/lib/instagram/types";
import { formatCount, formatPostDate } from "@/lib/format";
import {
  CommentIcon,
  HeartIcon,
  InstagramIcon,
  PlayIcon,
  RepostIcon,
  VerifiedBadgeIcon,
} from "@/components/icons";

import { PostCaption } from "./PostCaption";
import { PostShoppableButtons } from "./PostShoppableButtons";
import styles from "./feed.module.css";

const MEDIA_LABELS: Record<MediaType, string> = {
  image: "Фото",
  video: "Видео",
  carousel: "Карусель",
};

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const formattedDate = formatPostDate(post.postedAt);

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        {post.avatarUrl ? (
          <img
            className={styles.avatar}
            src={post.avatarUrl}
            alt=""
            width={36}
            height={36}
            loading="lazy"
          />
        ) : (
          <span className={styles.avatar} aria-hidden />
        )}

        <div className={styles.headerMeta}>
          <div className={styles.usernameRow}>
            <span className={styles.username}>{post.username}</span>
            {post.isVerified ? <VerifiedBadgeIcon /> : null}
          </div>
          {formattedDate ? (
            <time className={styles.postDate} dateTime={post.postedAt}>
              {formattedDate}
            </time>
          ) : null}
        </div>

        <a
          className={styles.permalink}
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Открыть пост в Instagram"
        >
          <InstagramIcon />
        </a>
      </header>

      <div className={styles.mediaWrap}>
        {post.mediaType === "video" ? (
          <>
            <video
              className={styles.media}
              src={post.mediaUrl}
              muted
              playsInline
              preload="metadata"
            />
            <span className={styles.playOverlay}>
              <PlayIcon />
            </span>
          </>
        ) : (
          <img
            className={styles.media}
            src={post.mediaUrl}
            alt=""
            loading="lazy"
          />
        )}
        <span className={styles.mediaBadge}>{MEDIA_LABELS[post.mediaType]}</span>
      </div>

      <div className={styles.engagement}>
        <span className={styles.engagementItem}>
          <HeartIcon size={22} />
          {formatCount(post.likesCount)}
        </span>
        <span className={styles.engagementItem}>
          <CommentIcon size={22} />
          {formatCount(post.commentsCount)}
        </span>
        <span className={styles.engagementItem}>
          <RepostIcon size={22} />
          {formatCount(post.repostsCount)}
        </span>
      </div>

      <PostCaption username={post.username} caption={post.caption} />
      <PostShoppableButtons post={post} />
    </article>
  );
}
