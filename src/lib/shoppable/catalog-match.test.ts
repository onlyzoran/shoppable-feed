import { describe, expect, it } from "vitest";

import { buildShoppableButtons } from "./generate-buttons";
import { matchCatalogProduct } from "./match-catalog-product";
import { GREZ_CATALOG, MADJ_CATALOG, MANEKENBRAND_CATALOG } from "./store-catalogs";

describe("matchCatalogProduct", () => {
  it("находит костюм Champion в подписи", () => {
    const match = matchCatalogProduct(
      "Возвращение бестселлера: костюм Champion в оттенке меланж снова в наличии",
      MANEKENBRAND_CATALOG,
    );

    expect(match).toEqual(
      expect.objectContaining({
        id: "champion",
        url: "https://manekenbrand.com/catalog/bestsellers/kostyum_champion_melanzh_1/",
      }),
    );
  });

  it("находит Urban Veil в длинной подписи", () => {
    const match = matchCatalogProduct(
      "Технологичная ветровка Urban Veil, в которой сочетаются комфорт и эстетика",
      MANEKENBRAND_CATALOG,
    );

    expect(match?.id).toBe("urban-veil");
  });

  it("не находит товар, которого нет на главной", () => {
    const match = matchCatalogProduct(
      "New: укороченный пуховик Dynamic motion в нежном розовом цвете",
      MANEKENBRAND_CATALOG,
    );

    expect(match).toBeNull();
  });
});

describe("matchCatalogProduct for MADJ", () => {
  it("находит Джемпер-поло в подписи", () => {
    const match = matchCatalogProduct(
      "Джемпер-поло — лёгкая база гардероба из новой коллекции",
      MADJ_CATALOG,
    );

    expect(match).toEqual(
      expect.objectContaining({
        id: "джемпер-поло",
        url: "https://madj.store/catalog/tproduct/566606298-614997613302-dzhemper-polo",
      }),
    );
  });
});

describe("matchCatalogProduct for GREZ", () => {
  it("находит PACK SUEÑO REPARADOR в подписи", () => {
    const match = matchCatalogProduct(
      "Duerme mejor con PACK SUEÑO REPARADOR — descanso profundo sin rellenos",
      GREZ_CATALOG,
    );

    expect(match).toEqual(
      expect.objectContaining({
        id: "pack-sueno-reparador",
        url: "https://www.thegrezway.cl/products/pack-sueno-reparador-descanso-profundo-apagado-mental-copia",
      }),
    );
  });

  it("находит REDOX-VITAL II по alias berberina", () => {
    const match = matchCatalogProduct(
      "Berberina: antes de comprar una molécula aislada, entiende esto — REDOX-VITAL II",
      GREZ_CATALOG,
    );

    expect(match?.id).toBe("redox-vital-ii");
  });
});

describe("buildShoppableButtons with GREZ catalog", () => {
  const baseInput = {
    mediaType: "image" as const,
    username: "thegrezwaycl",
    profileExternalUrl: "https://www.thegrezway.cl",
    profileBio: "Suplementos clean label — https://www.thegrezway.cl",
  };

  it("добавляет ссылку на pack и магазин", () => {
    const buttons = buildShoppableButtons({
      ...baseInput,
      caption: "PACK CONTROL DEL ESTRÉS para cortisol y retención de líquidos",
    });

    expect(buttons).toEqual([
      {
        kind: "link",
        label: "Магазин",
        url: "https://www.thegrezway.cl/",
      },
      {
        kind: "product",
        label: "PACK CONTROL DEL ESTRÉS",
        url: "https://www.thegrezway.cl/products/pack-control-estres-deshinchazon-drenaje-de-liquidos",
        price: "$58.384",
      },
    ]);
  });
});

describe("buildShoppableButtons with MANEKEN catalog", () => {
  const baseInput = {
    mediaType: "carousel" as const,
    username: "manekenbrand",
    profileExternalUrl: "https://manekenbrand.com",
    profileBio: "Каталог https://manekenbrand.com",
  };

  it("добавляет прямую ссылку на товар с главной", () => {
    const buttons = buildShoppableButtons({
      ...baseInput,
      caption: "Технологичная ветровка Urban Veil в трендовом цвете",
    });

    expect(buttons).toEqual([
      {
        kind: "link",
        label: "Магазин",
        url: "https://manekenbrand.com/",
      },
      {
        kind: "product",
        label: "Ветровка Urban Veil",
        url: "https://manekenbrand.com/catalog/new/vetrovka_urban_veil_siniy/",
        price: "24 000 ₽",
      },
    ]);
  });

  it("не добавляет кнопку товара без совпадения в каталоге", () => {
    const buttons = buildShoppableButtons({
      ...baseInput,
      caption: "Pop-up Maneken Brand в Афимолл Сити",
    });

    expect(buttons).toEqual([
      {
        kind: "link",
        label: "Магазин",
        url: "https://manekenbrand.com/",
      },
    ]);
  });
});
