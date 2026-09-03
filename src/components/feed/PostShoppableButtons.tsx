import { buildShoppableButtonsForPost } from "@/lib/shoppable";
import type { Post } from "@/lib/instagram/types";

import styles from "./feed.module.css";

type PostShoppableButtonsProps = {
  post: Post;
};

export function PostShoppableButtons({ post }: PostShoppableButtonsProps) {
  const buttons = buildShoppableButtonsForPost(post);

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className={styles.ctaRow}>
      {buttons.map((button) => (
        <a
          key={button.url}
          className={styles.ctaButton}
          href={button.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {button.label}
        </a>
      ))}
    </div>
  );
}
