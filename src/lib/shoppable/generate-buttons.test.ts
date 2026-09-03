import { describe, expect, it } from "vitest";

import { buildShoppableButtons } from "./generate-buttons";

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
      label: "Записаться",
      url: "https://booking.example.com/salon",
    });
    expect(buttons[1]).toEqual({
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
