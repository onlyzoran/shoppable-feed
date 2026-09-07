import type { Post } from "@/lib/instagram/types";

import { detectCommercialCategory } from "./detect-intent";
import { extractHashtags, extractUrlsFromText } from "./extract-urls";
import {
  buildMapsSearchUrl,
  buildWebSearchUrl,
  extractGeoFromCaption,
} from "./geo";
import { labelForUrl } from "./labels";
import type {
  CommercialCategory,
  ShoppableButton,
  ShoppableInput,
} from "./types";
import { MAX_SHOPPABLE_BUTTONS } from "./types";

function normalizeButtonUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

function addButton(
  buttons: ShoppableButton[],
  seenUrls: Set<string>,
  label: string,
  url: string,
): void {
  if (buttons.length >= MAX_SHOPPABLE_BUTTONS) {
    return;
  }

  const normalizedUrl = normalizeButtonUrl(url);
  if (seenUrls.has(normalizedUrl)) {
    return;
  }

  seenUrls.add(normalizedUrl);
  buttons.push({ label, url: normalizedUrl });
}

function collectExplicitUrlButtons(input: ShoppableInput): ShoppableButton[] {
  const sources = [
    input.caption,
    input.profileBio ?? "",
    ...(input.profileLinks ?? []),
    ...(input.profileExternalUrl ? [input.profileExternalUrl] : []),
  ];

  const buttons: ShoppableButton[] = [];
  const seenUrls = new Set<string>();

  for (const source of sources) {
    const urls =
      source.startsWith("http://") || source.startsWith("https://")
        ? [source]
        : extractUrlsFromText(source);

    for (const url of urls) {
      addButton(buttons, seenUrls, labelForUrl(url), url);
    }
  }

  return buttons;
}

function buildHeuristicButtons(
  input: ShoppableInput,
  category: CommercialCategory,
): ShoppableButton[] {
  const buttons: ShoppableButton[] = [];
  const seenUrls = new Set<string>();
  const geo = extractGeoFromCaption(input.caption);
  const locationQuery = geo ?? input.username;

  const profileUrl = input.profileExternalUrl?.trim();
  if (profileUrl) {
    addButton(buttons, seenUrls, labelForUrl(profileUrl), profileUrl);
  }

  switch (category) {
    case "salon": {
      addButton(
        buttons,
        seenUrls,
        "Салон",
        buildMapsSearchUrl(`${locationQuery} салон красоты`),
      );
      addButton(
        buttons,
        seenUrls,
        "Записаться",
        buildWebSearchUrl(`записаться ${locationQuery} салон`),
      );
      break;
    }
    case "travel": {
      addButton(
        buttons,
        seenUrls,
        "Купить тур",
        buildWebSearchUrl(`купить тур ${locationQuery}`),
      );
      if (geo) {
        addButton(
          buttons,
          seenUrls,
          "На карте",
          buildMapsSearchUrl(geo),
        );
      }
      break;
    }
    case "retail": {
      addButton(
        buttons,
        seenUrls,
        "Магазин",
        buildWebSearchUrl(`${input.username} магазин`),
      );
      if (geo) {
        addButton(
          buttons,
          seenUrls,
          "На карте",
          buildMapsSearchUrl(`${geo} магазин`),
        );
      }
      break;
    }
    case "generic": {
      addButton(
        buttons,
        seenUrls,
        "Сайт",
        buildWebSearchUrl(input.username),
      );
      if (geo) {
        addButton(
          buttons,
          seenUrls,
          "На карте",
          buildMapsSearchUrl(geo),
        );
      }
      break;
    }
  }

  return buttons;
}

export function buildShoppableButtons(input: ShoppableInput): ShoppableButton[] {
  const explicitButtons = collectExplicitUrlButtons(input);
  if (explicitButtons.length > 0) {
    return explicitButtons.slice(0, MAX_SHOPPABLE_BUTTONS);
  }

  const category = detectCommercialCategory(
    input.caption,
    input.profileBio ?? "",
  );
  if (!category) {
    return [];
  }

  return buildHeuristicButtons(input, category).slice(0, MAX_SHOPPABLE_BUTTONS);
}

export function buildShoppableButtonsForPost(post: Post): ShoppableButton[] {
  return buildShoppableButtons({
    caption: post.caption,
    mediaType: post.mediaType,
    username: post.username,
    profileBio: post.profileBio,
    profileExternalUrl: post.profileExternalUrl,
    profileLinks: post.profileLinks,
  });
}

export function extractShoppableContext(input: ShoppableInput) {
  return {
    hashtags: extractHashtags(input.caption),
    geo: extractGeoFromCaption(input.caption),
    category: detectCommercialCategory(input.caption, input.profileBio ?? ""),
  };
}
