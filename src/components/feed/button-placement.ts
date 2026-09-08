export type ButtonPlacement = "below" | "overlay" | "gallery" | "product-post";

export const BUTTON_PLACEMENT_OPTIONS: {
  value: ButtonPlacement;
  label: string;
}[] = [
  { value: "below", label: "In Post" },
  { value: "overlay", label: "On Media" },
  { value: "gallery", label: "Product Gallery" },
  { value: "product-post", label: "Product Post" },
];
