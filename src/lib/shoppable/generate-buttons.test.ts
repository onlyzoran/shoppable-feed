import { describe, expect, it } from "vitest";

import type { Post } from "@/lib/instagram/types";

import {
  buildShoppableButtons,
  collectProductButtonsFromPosts,
} from "./generate-buttons";

describe("buildShoppableButtons", () => {
  it("возвращает кнопки с осмысленными подписями для явных URL в подписи", () => {
    const buttons = buildShoppableButtons({
      caption:
        "Новая коллекция уже в магазине! https://shop.example.com/new-arrivals",
      mediaType: "image",
      username: "brandshop",
    });

    expect(buttons).toEqual([
      {
        kind: "link",
        label: "Магазин",
        url: "https://shop.example.com/new-arrivals",
      },
    ]);
  });

  it("приоритизирует URL из bio и подписи, дедуплицирует и ограничивает до 3", () => {
    const buttons = buildShoppableButtons({
      caption:
        "Запись онлайн https://booking.example.com/salon и сайт https://mysalon.ru",
      mediaType: "image",
      username: "beauty_salon",
      profileBio: "Салон красоты. https://mysalon.ru",
      profileExternalUrl: "https://mysalon.ru",
      profileLinks: ["https://mysalon.ru", "https://booking.example.com/salon"],
    });

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toEqual({
      kind: "link",
      label: "Записаться",
      url: "https://booking.example.com/salon",
    });
    expect(buttons[1]).toEqual({
      kind: "link",
      label: "Салон",
      url: "https://mysalon.ru/",
    });
  });

  it("генерирует эвристические кнопки для салона без явных URL", () => {
    const buttons = buildShoppableButtons({
      caption:
        "Маникюр и педикюр в центре 📍 Москва #beauty #nails Запись в директ",
      mediaType: "image",
      username: "nails_moscow",
      profileBio: "Студия маникюра",
    });

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toMatchObject({
      label: "Салон",
      url: expect.stringContaining("google.com/maps/search"),
    });
    expect(buttons[0]?.url).toContain(encodeURIComponent("Москва"));
    expect(buttons[1]).toMatchObject({
      label: "Записаться",
      url: expect.stringContaining("google.com/search"),
    });
  });

  it("генерирует кнопку тура для travel-интента", () => {
    const buttons = buildShoppableButtons({
      caption: "Лучшие туры в Турцию этим летом #travel #tour",
      mediaType: "carousel",
      username: "travel_agency",
    });

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toMatchObject({
      label: "Купить тур",
      url: expect.stringContaining("google.com/search?q="),
    });
    expect(decodeURIComponent(buttons[0]?.url ?? "")).toContain(
      "купить тур travel_agency",
    );
  });

  it("генерирует кнопку магазина для retail-интента на английском", () => {
    const buttons = buildShoppableButtons({
      caption:
        "POLKA DOT PRINT\n\nDiscover new arrivals from the LIMÉ underwear collection.",
      mediaType: "carousel",
      username: "limestorecom",
      profileExternalUrl: "https://limestore.com/ru_ru",
    });

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toEqual({
      kind: "product",
      label: "POLKA DOT PRINT",
      url: "https://limestore.com/ru_ru/search?q=POLKA+DOT+PRINT&type=product",
    });
  });

  it("добавляет кнопку коллекции поверх URL магазина из bio", () => {
    const buttons = buildShoppableButtons({
      caption: "SNAKE PRINT\n\nDiscover statement shoes and bags in LIMÉ.",
      mediaType: "carousel",
      username: "limestorecom",
      profileBio: "Shop online at https://limestore.com/ru_ru",
      profileExternalUrl: "https://limestore.com/ru_ru",
    });

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toMatchObject({
      label: "Магазин",
      url: "https://limestore.com/ru_ru",
    });
    expect(buttons[1]).toEqual({
      kind: "product",
      label: "SNAKE PRINT",
      url: "https://limestore.com/ru_ru/search?q=SNAKE+PRINT&type=product",
    });
  });

  it("возвращает пустой список без коммерческого интента", () => {
    const buttons = buildShoppableButtons({
      caption: "Красивый закат на море. Просто делюсь настроением.",
      mediaType: "image",
      username: "sunset_lover",
    });

    expect(buttons).toEqual([]);
  });

  it("не возвращает кнопки для instagram-ссылок в подписи", () => {
    const buttons = buildShoppableButtons({
      caption: "Подробности в профиле https://www.instagram.com/p/AbCdEf/",
      mediaType: "image",
      username: "creator",
    });

    expect(buttons).toEqual([]);
  });
});

describe("collectProductButtonsFromPosts", () => {
  const basePost: Omit<Post, "id" | "caption"> = {
    username: "manekenbrand",
    avatarUrl: "https://example.com/avatar.jpg",
    isVerified: true,
    postedAt: "2026-01-01T00:00:00.000Z",
    mediaUrl: "https://example.com/post.jpg",
    mediaType: "image",
    likesCount: 10,
    commentsCount: 2,
    repostsCount: 0,
    permalink: "https://www.instagram.com/p/test/",
    profileBio: "Каталог https://manekenbrand.com",
    profileExternalUrl: "https://manekenbrand.com",
    profileLinks: [],
  };

  it("собирает уникальные товары из всех постов", () => {
    const posts: Post[] = [
      {
        ...basePost,
        id: "1",
        caption: "Технологичная ветровка Urban Veil в трендовом цвете",
      },
      {
        ...basePost,
        id: "2",
        caption: "Возвращение бестселлера: костюм Champion в оттенке меланж",
      },
      {
        ...basePost,
        id: "3",
        caption: "Urban Veil снова в наличии — успейте заказать",
      },
    ];

    const products = collectProductButtonsFromPosts(posts);

    expect(products).toHaveLength(2);
    expect(products.map((product) => product.label)).toEqual([
      "Ветровка Urban Veil",
      "Костюм Champion",
    ]);
  });
});
