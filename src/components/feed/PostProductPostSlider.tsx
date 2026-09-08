"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { ShoppableButton } from "@/lib/shoppable/types";

import { ProductThumbImage } from "./ProductThumbImage";
import styles from "./feed.module.css";

type PostProductPostSliderProps = {
  buttons: ShoppableButton[];
  fallbackImageUrl?: string;
  onActiveIndexChange?: (index: number) => void;
};

type ScrollState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

function readScrollState(element: HTMLDivElement): ScrollState {
  return {
    canScrollLeft: element.scrollLeft > 1,
    canScrollRight:
      element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
  };
}

export function PostProductPostSlider({
  buttons,
  fallbackImageUrl,
  onActiveIndexChange,
}: PostProductPostSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    setScrollState(readScrollState(track));

    if (onActiveIndexChange && track.clientWidth > 0) {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      onActiveIndexChange(Math.min(Math.max(index, 0), buttons.length - 1));
    }
  }, [buttons.length, onActiveIndexChange]);

  useEffect(() => {
    updateScrollState();

    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [buttons, updateScrollState]);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: "smooth",
    });
  };

  if (buttons.length === 0) {
    return null;
  }

  const showArrows = buttons.length > 1;

  return (
    <div className={styles.productPostSlider}>
      <div ref={trackRef} className={styles.productPostSliderTrack} role="list">
        {buttons.map((button) => {
          const thumbUrl = button.imageUrl ?? fallbackImageUrl;

          return (
            <a
              key={button.url}
              className={styles.productPostSlide}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
            >
              {thumbUrl ? (
                <ProductThumbImage
                  className={styles.productPostSlideImage}
                  src={thumbUrl}
                />
              ) : (
                <span
                  className={styles.productPostSlideImagePlaceholder}
                  aria-hidden
                />
              )}
            </a>
          );
        })}
      </div>

      {showArrows ? (
        <>
          <button
            type="button"
            className={`${styles.productPostSliderArrow} ${styles.productPostSliderArrowLeft}`}
            aria-label="Предыдущий товар"
            disabled={!scrollState.canScrollLeft}
            onClick={() => scrollByPage(-1)}
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            className={`${styles.productPostSliderArrow} ${styles.productPostSliderArrowRight}`}
            aria-label="Следующий товар"
            disabled={!scrollState.canScrollRight}
            onClick={() => scrollByPage(1)}
          >
            <ChevronRightIcon size={18} />
          </button>
        </>
      ) : null}
    </div>
  );
}
