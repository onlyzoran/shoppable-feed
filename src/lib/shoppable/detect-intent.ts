import type { CommercialCategory } from "./types";
import { extractHashtags } from "./extract-urls";

const SALON_KEYWORDS = [
  "салон",
  "маникюр",
  "педикюр",
  "стрижк",
  "бров",
  "ресниц",
  "spa",
  "beauty",
  "barber",
  "косметолог",
  "студия",
  "услуг",
  "запись",
  "записаться",
  "прайс",
];

const TRAVEL_KEYWORDS = [
  "тур",
  "путешеств",
  "travel",
  "trip",
  "отель",
  "hotel",
  "vacation",
  "курорт",
  "авиабилет",
  "бронирован",
];

const RETAIL_KEYWORDS = [
  "магазин",
  "shop",
  "store",
  "купить",
  "заказ",
  "коллекц",
  "sale",
  "распродаж",
  "новинк",
  "доставк",
  "скидк",
  "цена",
  "price",
];

const SALON_HASHTAGS = new Set([
  "beauty",
  "nails",
  "hair",
  "salon",
  "manicure",
  "barber",
  "spa",
  "бьюти",
  "маникюр",
  "салон",
]);

const TRAVEL_HASHTAGS = new Set([
  "travel",
  "trip",
  "tour",
  "wanderlust",
  "vacation",
  "путешествия",
  "тур",
]);

const RETAIL_HASHTAGS = new Set([
  "shop",
  "sale",
  "store",
  "shopping",
  "магазин",
  "продажа",
  "новинки",
]);

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce(
    (count, keyword) => (lower.includes(keyword) ? count + 1 : count),
    0,
  );
}

function countHashtagMatches(
  hashtags: string[],
  allowed: Set<string>,
): number {
  return hashtags.reduce(
    (count, tag) => (allowed.has(tag) ? count + 1 : count),
    0,
  );
}

export function detectCommercialCategory(
  caption: string,
  profileBio = "",
): CommercialCategory | null {
  const combined = `${caption}\n${profileBio}`.trim();
  if (!combined) {
    return null;
  }

  const hashtags = [
    ...extractHashtags(caption),
    ...extractHashtags(profileBio),
  ];

  const scores: Record<CommercialCategory, number> = {
    salon: countMatches(combined, SALON_KEYWORDS) + countHashtagMatches(hashtags, SALON_HASHTAGS) * 2,
    travel: countMatches(combined, TRAVEL_KEYWORDS) + countHashtagMatches(hashtags, TRAVEL_HASHTAGS) * 2,
    retail: countMatches(combined, RETAIL_KEYWORDS) + countHashtagMatches(hashtags, RETAIL_HASHTAGS) * 2,
    generic: 0,
  };

  const best = (Object.entries(scores) as [CommercialCategory, number][])
    .filter(([category]) => category !== "generic")
    .sort((left, right) => right[1] - left[1])[0];

  if (!best || best[1] === 0) {
    const hasCommercialCue =
      countMatches(combined, ["купить", "заказ", "запись", "shop", "sale"]) > 0;
    return hasCommercialCue ? "generic" : null;
  }

  return best[0];
}
