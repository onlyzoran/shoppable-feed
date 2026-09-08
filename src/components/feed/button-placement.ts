export type ButtonPlacement = "below" | "overlay" | "gallery";

export const BUTTON_PLACEMENT_OPTIONS: {
  value: ButtonPlacement;
  label: string;
}[] = [
  { value: "below", label: "In Post" },
  { value: "overlay", label: "On Media" },
  { value: "gallery", label: "Product Gallery" },
];
