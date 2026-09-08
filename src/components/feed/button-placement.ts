export type ButtonPlacement = "below" | "overlay" | "gallery";

export const BUTTON_PLACEMENT_OPTIONS: {
  value: ButtonPlacement;
  label: string;
}[] = [
  { value: "below", label: "Под подписью" },
  { value: "overlay", label: "На картинке" },
  { value: "gallery", label: "Галерея товаров" },
];
