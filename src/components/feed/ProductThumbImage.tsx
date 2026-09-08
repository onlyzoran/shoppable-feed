"use client";

import { useState, type SyntheticEvent } from "react";

import styles from "./feed.module.css";

type ProductThumbImageProps = {
  src: string;
  className: string;
};

export function ProductThumbImage({ src, className }: ProductThumbImageProps) {
  const [isPortrait, setIsPortrait] = useState(false);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;

    if (image.naturalHeight > image.naturalWidth) {
      setIsPortrait(true);
    }
  };

  return (
    <img
      className={`${className}${
        isPortrait ? ` ${styles.productThumbPortrait}` : ""
      }`}
      src={src}
      alt=""
      loading="lazy"
      onLoad={handleLoad}
    />
  );
}
