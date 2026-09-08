import { ShoppingBagIcon } from "@/components/icons";
import type { ShoppableButton } from "@/lib/shoppable/types";

import { ProductThumbImage } from "./ProductThumbImage";
import styles from "./feed.module.css";

type PostProductPinProps = {
  button: ShoppableButton;
  fallbackImageUrl?: string;
};

export function PostProductPin({
  button,
  fallbackImageUrl,
}: PostProductPinProps) {
  const thumbUrl = button.imageUrl ?? fallbackImageUrl;

  return (
    <a
      className={styles.overlayPin}
      href={button.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={button.label}
    >
      <span className={styles.overlayPinIcon} aria-hidden>
        <ShoppingBagIcon size={18} />
      </span>
      <span className={styles.productPinCard}>
        {thumbUrl ? (
          <ProductThumbImage
            className={styles.productPinCardThumb}
            src={thumbUrl}
          />
        ) : (
          <span className={styles.productPinCardThumbPlaceholder} aria-hidden />
        )}
        <span className={styles.productPinCardMeta}>
          <span className={styles.productPinCardTitle}>{button.label}</span>
          {button.price ? (
            <span className={styles.productPinCardPrice}>{button.price}</span>
          ) : null}
          <span className={styles.productPinCardCta}>В магазин</span>
        </span>
      </span>
    </a>
  );
}
