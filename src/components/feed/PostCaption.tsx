"use client";

import { Fragment, useState } from "react";

import styles from "./feed.module.css";

const CAPTION_PREVIEW_LENGTH = 125;
const TOKEN_PATTERN = /(#\w+|@\w+)/g;

type PostCaptionProps = {
  username: string;
  caption: string;
};

function renderCaptionText(text: string) {
  const parts = text.split(TOKEN_PATTERN);

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <span className={styles.hashtag} key={`${part}-${index}`}>
          {part}
        </span>
      );
    }

    if (part.startsWith("@")) {
      return (
        <span className={styles.mention} key={`${part}-${index}`}>
          {part}
        </span>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export function PostCaption({ username, caption }: PostCaptionProps) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = caption.trim();

  if (!trimmed) {
    return null;
  }

  const isLong = trimmed.length > CAPTION_PREVIEW_LENGTH;
  const visibleText =
    expanded || !isLong
      ? trimmed
      : `${trimmed.slice(0, CAPTION_PREVIEW_LENGTH).trimEnd()}…`;

  return (
    <div className={styles.caption}>
      <span className={styles.captionUsername}>{username}</span>
      {renderCaptionText(visibleText)}
      {isLong && !expanded ? (
        <button
          type="button"
          className={styles.moreButton}
          onClick={() => setExpanded(true)}
        >
          ещё
        </button>
      ) : null}
    </div>
  );
}
