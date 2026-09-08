export type ButtonPlacement = "below" | "overlay" | "gallery";

export const BUTTON_PLACEMENT_OPTIONS: {
  value: ButtonPlacement;
  label: string;
}[] = [
  { value: "below", label: "In post" },
  { value: "overlay", label: "On media" },
  { value: "gallery", label: "Product gallery" },
];
