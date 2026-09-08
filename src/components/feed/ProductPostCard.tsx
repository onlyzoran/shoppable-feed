"use client";

import { useState } from "react";

import type { Post } from "@/lib/instagram/types";
import type { ShoppableButton } from "@/lib/shoppable/types";
import { VerifiedBadgeIcon } from "@/components/icons";

import { PostProductPostSlider } from "./PostProductPostSlider";
import { PostShoppableButtons } from "./PostShoppableButtons";
import styles from "./feed.module.css";

type ProductPostCardProps = {
  post: Post;
  buttons: ShoppableButton[];
};

export function ProductPostCard({ post, buttons }: ProductPostCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fallbackImageUrl = post.mediaPosterUrl ?? post.mediaUrl;
  const activeButton = buttons[activeIndex] ?? buttons[0];

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div className={styles.headerMeta}>
          <div className={styles.usernameRow}>
            <span className={styles.username}>{post.username}</span>
            {post.isVerified ? <VerifiedBadgeIcon /> : null}
          </div>
          <span className={styles.postDate} aria-hidden="true">
            &nbsp;
          </span>
        </div>
      </header>

      <div className={styles.mediaWrap}>
        <div className={styles.mediaClip}>
          <PostProductPostSlider
            buttons={buttons}
            fallbackImageUrl={fallbackImageUrl}
            onActiveIndexChange={setActiveIndex}
          />
        </div>
      </div>

      {activeButton ? (
        <div className={styles.caption}>
          <div className={styles.productPostCaption}>
            <a
              className={styles.productPostCaptionLink}
              href={activeButton.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {activeButton.label}
            </a>
            {activeButton.price ? (
              <span className={styles.productPostCaptionPrice}>
                {activeButton.price}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <PostShoppableButtons post={post} placement="below" />
    </article>
  );
}
