import { CalendarIcon } from "@/components/icons";
import { buildShoppableButtonsForPost } from "@/lib/shoppable";
import type { ShoppableButton } from "@/lib/shoppable/types";
import type { Post } from "@/lib/instagram/types";

import type { ButtonPlacement } from "./button-placement";
import styles from "./feed.module.css";

type PostShoppableButtonsProps = {
  post: Post;
  placement?: ButtonPlacement;
  show?: "all" | "below" | "pin";
};

/** Кнопки, которые в overlay-режиме остаются под подписью. */
const BELOW_ONLY_LABELS = new Set([
  "Магазин",
  "Сайт",
  "Салон",
  "Купить тур",
]);

function isBelowOnlyButton(button: ShoppableButton): boolean {
  return BELOW_ONLY_LABELS.has(button.label);
}

function isPinButton(button: ShoppableButton): boolean {
  return !isBelowOnlyButton(button);
}

function filterButtons(
  buttons: ShoppableButton[],
  show: PostShoppableButtonsProps["show"],
): ShoppableButton[] {
  if (show === "below") {
    return buttons.filter(isBelowOnlyButton);
  }

  if (show === "pin") {
    return buttons.filter(isPinButton);
  }

  return buttons;
}

export function PostShoppableButtons({
  post,
  placement = "below",
  show = "all",
}: PostShoppableButtonsProps) {
  const buttons = filterButtons(buildShoppableButtonsForPost(post), show);

  if (buttons.length === 0) {
    return null;
  }

  if (placement === "overlay") {
    return (
      <>
        {buttons.map((button) => {
          const isBooking = button.label === "Записаться";

          return (
            <a
              key={button.url}
              className={
                isBooking ? styles.ctaBookingPin : styles.ctaProductPin
              }
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={button.label}
              title={button.label}
            >
              <span
                className={
                  isBooking
                    ? styles.ctaBookingPinIcon
                    : styles.ctaProductPinIcon
                }
                aria-hidden
              >
                {isBooking ? <CalendarIcon size={22} /> : "+"}
              </span>
              <span className={styles.ctaProductPinTooltip}>
                {button.label}
              </span>
            </a>
          );
        })}
      </>
    );
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
