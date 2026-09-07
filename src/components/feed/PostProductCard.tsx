import type { ShoppableButton } from "@/lib/shoppable/types";

import styles from "./feed.module.css";

type PostProductCardProps = {
  button: ShoppableButton;
  fallbackImageUrl?: string;
};

export function PostProductCard({
  button,
  fallbackImageUrl,
}: PostProductCardProps) {
  const thumbUrl = button.imageUrl ?? fallbackImageUrl;

  return (
    <a
      className={styles.productCard}
      href={button.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {thumbUrl ? (
        <img
          className={styles.productCardThumb}
          src={thumbUrl}
          alt=""
          loading="lazy"
        />
      ) : (
        <span className={styles.productCardThumbPlaceholder} aria-hidden />
      )}
      <span className={styles.productCardMeta}>
        <span className={styles.productCardTitle}>{button.label}</span>
        {button.price ? (
          <span className={styles.productCardPrice}>{button.price}</span>
        ) : null}
      </span>
    </a>
  );
}
