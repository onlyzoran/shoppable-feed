"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ShoppingBagIcon } from "@/components/icons";
import type { ShoppableButton } from "@/lib/shoppable/types";

import { ProductThumbImage } from "./ProductThumbImage";
import styles from "./feed.module.css";

type PostProductPinProps = {
  buttons: ShoppableButton[];
  fallbackImageUrl?: string;
};

export function PostProductPin({
  buttons,
  fallbackImageUrl,
}: PostProductPinProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (buttons.length === 0) {
    return null;
  }

  const productCountLabel =
    buttons.length === 1 ? "1 product" : `${buttons.length} products`;

  return (
    <div ref={rootRef} className={styles.overlayPinWrap}>
      <button
        type="button"
        className={styles.overlayPinButton}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={productCountLabel}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.overlayPinIcon} aria-hidden>
          <ShoppingBagIcon size={18} />
        </span>
      </button>
      {open ? (
        <div
          id={listId}
          className={styles.productPinList}
          role="region"
          aria-label="Products"
        >
          {buttons.map((button) => {
            const thumbUrl = button.imageUrl ?? fallbackImageUrl;

            return (
              <a
                key={button.url}
                className={styles.productPinListItem}
                href={button.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {thumbUrl ? (
                  <ProductThumbImage
                    className={styles.productPinCardThumb}
                    src={thumbUrl}
                  />
                ) : (
                  <span
                    className={styles.productPinCardThumbPlaceholder}
                    aria-hidden
                  />
                )}
                <span className={styles.productPinCardMeta}>
                  <span className={styles.productPinCardTitle}>
                    {button.label}
                  </span>
                  {button.price ? (
                    <span className={styles.productPinCardPrice}>
                      {button.price}
                    </span>
                  ) : null}
                  <span className={styles.productPinCardCta}>В магазин</span>
                </span>
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
