import type { ShoppableButton } from "@/lib/shoppable/types";

import { ProductThumbImage } from "./ProductThumbImage";
import styles from "./feed.module.css";

type PostProductGalleryTileProps = {
  button: ShoppableButton;
  fallbackImageUrl?: string;
};

export function PostProductGalleryTile({
  button,
  fallbackImageUrl,
}: PostProductGalleryTileProps) {
  const thumbUrl = button.imageUrl ?? fallbackImageUrl;

  return (
    <a
      className={styles.productGalleryTile}
      href={button.url}
      target="_blank"
      rel="noopener noreferrer"
      role="listitem"
    >
      {thumbUrl ? (
        <ProductThumbImage
          className={styles.productGalleryThumb}
          src={thumbUrl}
        />
      ) : (
        <span className={styles.productGalleryThumbPlaceholder} aria-hidden />
      )}
      <span className={styles.productGalleryTitle}>{button.label}</span>
      {button.price ? (
        <span className={styles.productGalleryPrice}>{button.price}</span>
      ) : null}
    </a>
  );
}
