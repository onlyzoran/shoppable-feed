import type { Post } from "@/lib/instagram/types";
import { formatCount, formatPostDate } from "@/lib/format";
import {
  buildShoppableButtonsForPost,
  findProductButtons,
} from "@/lib/shoppable";
import {
  CommentIcon,
  HeartIcon,
  InstagramIcon,
  PlayIcon,
  RepostIcon,
  VerifiedBadgeIcon,
} from "@/components/icons";

import { PostCaption } from "./PostCaption";
import { PostProductCarousel } from "./PostProductCarousel";
import { PostProductPin } from "./PostProductPin";
import { PostShoppableButtons } from "./PostShoppableButtons";
import type { ButtonPlacement } from "./button-placement";
import styles from "./feed.module.css";

type PostCardProps = {
  post: Post;
  buttonPlacement?: ButtonPlacement;
};

export function PostCard({
  post,
  buttonPlacement = "below",
}: PostCardProps) {
  const formattedDate = formatPostDate(post.postedAt);
  const showOverlay = buttonPlacement === "overlay";
  const hidePostProducts =
    buttonPlacement === "gallery" || buttonPlacement === "product-post";
  const shoppableButtons = buildShoppableButtonsForPost(post);
  const productButtons = findProductButtons(shoppableButtons);
  const fallbackProductImage = post.mediaPosterUrl ?? post.mediaUrl;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
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
        <div className={styles.mediaClip}>
          {post.mediaType === "video" ? (
            <>
              <img
                className={styles.media}
                src={post.mediaPosterUrl ?? post.mediaUrl}
                alt=""
                loading="lazy"
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
        </div>
        {showOverlay ? (
          <>
            {productButtons.length > 0 ? (
              <PostProductPin
                buttons={productButtons}
                fallbackImageUrl={fallbackProductImage}
              />
            ) : null}
            <PostShoppableButtons post={post} placement="overlay" show="pin" />
          </>
        ) : null}
      </div>

      {productButtons.length > 0 && !showOverlay && !hidePostProducts ? (
        <PostProductCarousel
          buttons={productButtons}
          fallbackImageUrl={fallbackProductImage}
        />
      ) : null}

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
      {showOverlay ? (
        <PostShoppableButtons post={post} placement="below" show="below" />
      ) : (
        <PostShoppableButtons post={post} placement="below" />
      )}
    </article>
  );
}
