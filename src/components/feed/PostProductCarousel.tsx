"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { ShoppableButton } from "@/lib/shoppable/types";

import { PostProductCard } from "./PostProductCard";
import styles from "./feed.module.css";

type PostProductCarouselProps = {
  buttons: ShoppableButton[];
  fallbackImageUrl?: string;
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

export function PostProductCarousel({
  buttons,
  fallbackImageUrl,
}: PostProductCarouselProps) {
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
  }, []);

  useEffect(() => {
    updateScrollState();

    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(track);
    for (const child of track.children) {
      resizeObserver.observe(child);
    }

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

    const firstCard = track.querySelector<HTMLElement>(`.${styles.productCard}`);
    const gap = Number.parseFloat(getComputedStyle(track).gap || "24");
    const cardStep =
      (firstCard?.offsetWidth ?? track.clientWidth * 0.75) + gap;

    track.scrollBy({
      left: direction * cardStep,
      behavior: "smooth",
    });
  };

  if (buttons.length === 0) {
    return null;
  }

  if (buttons.length === 1) {
    return (
      <PostProductCard
        button={buttons[0]}
        fallbackImageUrl={fallbackImageUrl}
      />
    );
  }

  const showArrows = buttons.length > 1;

  return (
    <div className={styles.productCarouselWrap}>
      {showArrows ? (
        <button
          type="button"
          className={styles.productCarouselArrow}
          aria-label="Предыдущий товар"
          disabled={!scrollState.canScrollLeft}
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeftIcon size={18} />
        </button>
      ) : null}

      <div
        ref={trackRef}
        className={styles.productCarousel}
        role="list"
        aria-label="Товары"
      >
        {buttons.map((button) => (
          <PostProductCard
            key={button.url}
            button={button}
            fallbackImageUrl={fallbackImageUrl}
          />
        ))}
      </div>

      {showArrows ? (
        <button
          type="button"
          className={styles.productCarouselArrow}
          aria-label="Следующий товар"
          disabled={!scrollState.canScrollRight}
          onClick={() => scrollByPage(1)}
        >
          <ChevronRightIcon size={18} />
        </button>
      ) : null}
    </div>
  );
}
