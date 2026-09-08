import type { Post } from "@/lib/instagram/types";

import { buildStoreProductSearchUrl } from "./build-store-url";
import { detectCommercialCategory } from "./detect-intent";
import {
  extractProductHeadline,
  truncateButtonLabel,
} from "./extract-product-headline";
import { extractHashtags, extractUrlsFromText } from "./extract-urls";
import { matchCatalogProduct, matchCatalogProducts } from "./match-catalog-product";
import { getStoreCatalog } from "./store-catalogs";
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
import { MAX_PRODUCT_BUTTONS, MAX_SHOPPABLE_BUTTONS } from "./types";

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
  options: Pick<ShoppableButton, "kind" | "imageUrl" | "price"> = {
    kind: "link",
  },
): void {
  if (buttons.length >= MAX_SHOPPABLE_BUTTONS) {
    return;
  }

  const normalizedUrl = normalizeButtonUrl(url);
  if (seenUrls.has(normalizedUrl)) {
    return;
  }

  seenUrls.add(normalizedUrl);
  buttons.push({
    kind: options.kind,
    label,
    url: normalizedUrl,
    ...(options.imageUrl ? { imageUrl: options.imageUrl } : {}),
    ...(options.price ? { price: options.price } : {}),
  });
}

function collectExplicitUrlButtons(input: ShoppableInput): ShoppableButton[] {
  const sources = [
    input.caption,
    input.profileBio ?? "",
    ...(input.profileLinks ?? []),
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

function addProductButton(
  buttons: ShoppableButton[],
  seenUrls: Set<string>,
  button: ShoppableButton,
): void {
  if (buttons.filter((item) => item.kind === "product").length >= MAX_PRODUCT_BUTTONS) {
    return;
  }

  const normalizedUrl = normalizeButtonUrl(button.url);
  if (seenUrls.has(normalizedUrl)) {
    return;
  }

  seenUrls.add(normalizedUrl);
  buttons.push(button);
}

function catalogProductToButton(product: {
  label: string;
  url: string;
  imageUrl?: string;
  price?: string;
}): ShoppableButton {
  return {
    kind: "product",
    label: truncateButtonLabel(product.label),
    url: product.url,
    imageUrl: product.imageUrl,
    price: product.price,
  };
}

function buildCatalogProductButtons(input: ShoppableInput): ShoppableButton[] {
  const storeUrl = input.profileExternalUrl?.trim();
  if (!storeUrl) {
    return [];
  }

  const catalog = getStoreCatalog(storeUrl);
  if (!catalog) {
    return [];
  }

  return matchCatalogProducts(input.caption, catalog).map(catalogProductToButton);
}

function buildProductSearchButton(input: ShoppableInput): ShoppableButton | null {
  const storeUrl = input.profileExternalUrl?.trim();

  if (!storeUrl) {
    return null;
  }

  const catalog = getStoreCatalog(storeUrl);
  if (catalog) {
    const catalogMatch = matchCatalogProduct(input.caption, catalog);
    if (!catalogMatch) {
      return null;
    }

    return catalogProductToButton(catalogMatch);
  }

  const category = detectCommercialCategory(
    input.caption,
    input.profileBio ?? "",
  );
  if (category !== "retail") {
    return null;
  }

  const headline = extractProductHeadline(input.caption);
  if (!headline) {
    return null;
  }

  return {
    kind: "product",
    label: truncateButtonLabel(headline),
    url: buildStoreProductSearchUrl(storeUrl, headline),
  };
}

function collectDirectButtons(input: ShoppableInput): ShoppableButton[] {
  const linkButtons = collectExplicitUrlButtons(input);
  const seenUrls = new Set(linkButtons.map((button) => button.url));
  const productButtons = buildCatalogProductButtons(input);

  if (productButtons.length === 0) {
    const productButton = buildProductSearchButton(input);
    if (productButton) {
      addProductButton(linkButtons, seenUrls, productButton);
    } else {
      const profileUrl = input.profileExternalUrl?.trim();
      if (profileUrl) {
        addButton(linkButtons, seenUrls, labelForUrl(profileUrl), profileUrl);
      }
    }

    return linkButtons;
  }

  for (const productButton of productButtons) {
    addProductButton(linkButtons, seenUrls, productButton);
  }

  return linkButtons;
}

function partitionShoppableButtons(buttons: ShoppableButton[]): ShoppableButton[] {
  const linkButtons = buttons
    .filter((button) => button.kind !== "product")
    .slice(0, MAX_SHOPPABLE_BUTTONS);
  const productButtons = buttons
    .filter((button) => button.kind === "product")
    .slice(0, MAX_PRODUCT_BUTTONS);

  return [...linkButtons, ...productButtons];
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
  const directButtons = collectDirectButtons(input);
  if (directButtons.length > 0) {
    return partitionShoppableButtons(directButtons);
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

export function findProductButton(
  buttons: ShoppableButton[],
): ShoppableButton | null {
  return findProductButtons(buttons)[0] ?? null;
}

export function findProductButtons(
  buttons: ShoppableButton[],
): ShoppableButton[] {
  return buttons.filter((button) => button.kind === "product");
}

export function collectProductButtonsFromPosts(posts: Post[]): ShoppableButton[] {
  const seenUrls = new Set<string>();
  const products: ShoppableButton[] = [];

  for (const post of posts) {
    for (const button of findProductButtons(buildShoppableButtonsForPost(post))) {
      const normalizedUrl = normalizeButtonUrl(button.url);
      if (seenUrls.has(normalizedUrl)) {
        continue;
      }

      seenUrls.add(normalizedUrl);
      products.push(button);
    }
  }

  return products;
}

export function extractShoppableContext(input: ShoppableInput) {
  return {
    hashtags: extractHashtags(input.caption),
    geo: extractGeoFromCaption(input.caption),
    category: detectCommercialCategory(input.caption, input.profileBio ?? ""),
  };
}
