import type { ExampleSource } from "./types";

/**
 * Профили с mock-данными в mock-data/.
 * Файлы с пустым payload — шаблоны: заполните постами из Instagram-export.
 */
export const EXAMPLE_SOURCES: ExampleSource[] = [
  {
    id: "manekenbrand",
    label: "MANEKEN",
    profileUrl: "https://www.instagram.com/manekenbrand/",
    fileName: "manekenbrand.json",
    profileBio:
      "Oversize-одежда. Каталог и доставка по России — https://manekenbrand.com",
    profileExternalUrl: "https://manekenbrand.com",
    profileLinks: ["https://manekenbrand.com"],
  },
  {
    id: "madj_store",
    label: "MADJ",
    profileUrl: "https://www.instagram.com/madj_store/",
    fileName: "madj_store.json",
    profileBio: "Одежда через ощущения — https://madj.store",
    profileExternalUrl: "https://madj.store",
    profileLinks: ["https://madj.store"],
  },
  {
    id: "dropsstore.ru",
    label: "DROP'S",
    profileUrl: "https://www.instagram.com/dropsstore.ru/",
    fileName: "dropsstore.json",
    profileBio:
      "Бренд одежды из Сибири. Лимитированные дропы — https://www.dropsstore.ru",
    profileExternalUrl: "https://www.dropsstore.ru",
    profileLinks: ["https://www.dropsstore.ru"],
  },
  {
    id: "citynails_moscow",
    label: "CITY NAILS",
    profileUrl: "https://www.instagram.com/citynails_moscow/",
    fileName: "citynails.json",
    profileBio:
      "Сеть студий маникюра и красоты в Москве. Запись онлайн: https://yclients.com/salon/city-nails/135934/",
    profileExternalUrl: "https://citynails.studio",
    profileLinks: [
      "https://citynails.studio",
      "https://yclients.com/salon/city-nails/135934/",
    ],
  },
  {
    id: "thegrezwaycl",
    label: "GREZ",
    profileUrl: "https://www.instagram.com/thegrezwaycl/",
    fileName: "thegrezway.json",
    profileBio:
      "Suplementos clean label de Pedro Grez. Sin rellenos — https://www.thegrezway.cl",
    profileExternalUrl: "https://www.thegrezway.cl",
    profileLinks: ["https://www.thegrezway.cl"],
  },
];

export function findExampleByProfileUrl(profileUrl: string): ExampleSource | null {
  const normalized = profileUrl.trim().replace(/\/+$/, "").toLowerCase();

  return (
    EXAMPLE_SOURCES.find((example) => {
      const exampleUrl = example.profileUrl.replace(/\/+$/, "").toLowerCase();
      return (
        normalized === exampleUrl ||
        normalized.endsWith(`/${example.id.toLowerCase()}`)
      );
    }) ?? null
  );
}

export function isRealInstagramPermalink(link: string): boolean {
  if (!link.includes("instagram.com/p/")) {
    return false;
  }

  return !/\/p\/(?:MadjMock|DropsMock|CityNails|ChopChop|LimeStore|Storeez|GoldApple|Podrygka|LevelTravel|CoralTravel|PachkaCoffee|CodeRed|AsyaDrop)\d+/i.test(
    link,
  );
}
