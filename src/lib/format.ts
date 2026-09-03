export function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
