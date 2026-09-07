export function extractProductHeadline(caption: string): string | null {
  const firstLine = caption.trim().split(/\r?\n/)[0]?.trim();

  if (!firstLine || firstLine.length < 3) {
    return null;
  }

  if (/^https?:\/\//i.test(firstLine)) {
    return null;
  }

  if (firstLine.includes("#") || firstLine.includes("📍") || firstLine.length > 60) {
    return null;
  }

  return firstLine;
}

export function truncateButtonLabel(label: string, maxLength = 32): string {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength - 1)}…`;
}
