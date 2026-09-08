import { describe, expect, it } from "vitest";

import { buildShoppableButtons } from "./generate-buttons";
import { matchCatalogProduct, matchCatalogProducts } from "./match-catalog-product";
import {
  ADAHLAZORGAN_CATALOG,
  BANANHOT_CATALOG,
  DROPSSTORE_CATALOG,
  GREZ_CATALOG,
  MADJ_CATALOG,
  MANEKENBRAND_CATALOG,
  MEUNDIES_CATALOG,
  WILDFLOWERCASES_CATALOG,
  BROOKLINEN_CATALOG,
} from "./store-catalogs";

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

describe("matchCatalogProducts for DROPS", () => {
  const septemberCaption =
    "Собрали для вас образы на сентябрь 🍂\nдля любого повода и настроения :\n\n1. Пальто из 100% шерсти ‘pearl’ 21990₽\n Платье ‘Монако’ 9990₽-70% / 2997₽\n\n2.Рубашка утепленная в клетку 8490₽\n Жилет ‘beige’ 11990₽-30% /  8393₽\n Джоггеры ‘mokko’ 9490₽\n\n3.Юбка из тенсела макси \n ‘dark flower’  6990₽ -40% / 4194₽\n\n4.Жилет ‘gray’\n Худи с начёсом ‘dark gray’  8990₽ -20% / 7192₽\n Джоггеры с начёсом ‘dark grey’ 8490₽-20% / 6792₽\n\nВ наличии на сайте: dropsstore.ru";

  it("находит все товары из подписи с образами", () => {
    const matches = matchCatalogProducts(septemberCaption, DROPSSTORE_CATALOG);

    expect(matches.map((product) => product.id)).toEqual([
      "пальто-из-шерсти",
      "платье-monaco",
      "рубашка-в-клетку",
      "жилетка",
      "джоггеры",
      "юбка-макси-из-тенсела",
      "жилетка-gray",
      "худи",
    ]);
  });
});

describe("buildShoppableButtons with DROPS catalog", () => {
  const baseInput = {
    mediaType: "image" as const,
    username: "dropsstore.ru",
    profileExternalUrl: "https://www.dropsstore.ru",
    profileBio: "DROP'S — dropsstore.ru",
  };

  it("добавляет карточки для всех товаров из подписи", () => {
    const buttons = buildShoppableButtons({
      ...baseInput,
      caption:
        "Собрали для вас образы на сентябрь 🍂\n1. Пальто из 100% шерсти ‘pearl’ 21990₽\n Платье ‘Монако’ 9990₽-70% / 2997₽\n2.Рубашка утепленная в клетку 8490₽\n Жилет ‘beige’ 11990₽-30% /  8393₽\n Джоггеры ‘mokko’ 9490₽\n3.Юбка из тенсела макси ‘dark flower’ 6990₽ -40% / 4194₽\n4.Жилет ‘gray’\n Худи с начёсом ‘dark gray’ 8990₽ -20% / 7192₽",
    });

    const productButtons = buttons.filter((button) => button.kind === "product");
    expect(productButtons.length).toBeGreaterThanOrEqual(7);
    expect(productButtons.map((button) => button.label)).toEqual(
      expect.arrayContaining([
        "Пальто из шерсти",
        "Платье Monaco",
        "Рубашка в клетку",
        "Жилетка",
        "Джоггеры",
        "Юбка макси из тенсела",
        "Жилетка Gray",
        "Худи",
      ]),
    );
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

describe("matchCatalogProduct for BANANHOT", () => {
  it("находит NINA SCARLET RED в подписи", () => {
    const match = matchCatalogProduct(
      "The Nina Bikini Set in NINA SCARLET RED — shop at bananhot.com",
      BANANHOT_CATALOG,
    );

    expect(match).toEqual(
      expect.objectContaining({
        label: "NINA SCARLET RED",
        url: expect.stringContaining("bananhot.com/products/nina-scarlet-red"),
      }),
    );
  });

  it("находит Nina Bikini Set в подписи", () => {
    const match = matchCatalogProduct(
      "The Nina Bikini Set is the ultimate choice for looking effortlessly stunning",
      BANANHOT_CATALOG,
    );

    expect(match?.label).toMatch(/^NINA /);
  });

  it("находит LUNA ROCKROSE в подписи", () => {
    const match = matchCatalogProduct(
      "LUNA ROCKROSE bikini season is here — shop at bananhot.com",
      BANANHOT_CATALOG,
    );

    expect(match?.label).toBe("LUNA ROCKROSE PAISLEY");
  });
});

describe("matchCatalogProduct for ADAH", () => {
  it("находит BLUSH STICK в подписи", () => {
    const match = matchCatalogProduct(
      "My everyday glow: BLUSH STICK in the softest pink — adahlazorgan.com",
      ADAHLAZORGAN_CATALOG,
    );

    expect(match).toEqual(
      expect.objectContaining({
        label: "BLUSH STICK",
        url: expect.stringContaining("adahlazorgan.com/products/blush-stick"),
      }),
    );
  });

  it("находит BROW WAX в подписи", () => {
    const match = matchCatalogProduct(
      "BROW WAX is the secret to laminated brows without color residue",
      ADAHLAZORGAN_CATALOG,
    );

    expect(match?.label).toBe("BROW WAX");
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

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toEqual({
      kind: "link",
      label: "Магазин",
      url: "https://www.thegrezway.cl/",
    });
    expect(buttons[1]).toMatchObject({
      kind: "product",
      label: "PACK CONTROL DEL ESTRÉS",
      url: "https://www.thegrezway.cl/products/pack-control-estres-deshinchazon-drenaje-de-liquidos",
      price: "$58.384",
      imageUrl: expect.stringMatching(/^https:\/\//),
    });
  });
});

describe("matchCatalogProduct for WILDFLOWER", () => {
  it("находит Ahoy Babe в подписи", () => {
    const match = matchCatalogProduct(
      "NEW RELEASE 💜 Ahoy Babe x WF — shop now at wildflowercases.com",
      WILDFLOWERCASES_CATALOG,
    );

    expect(match).toEqual(
      expect.objectContaining({
        label: "Ahoy Babe",
        url: expect.stringContaining(
          "wildflowercases.com/products/ahoy-babe-nautical-iphone-case",
        ),
        price: "$37",
        imageUrl: expect.stringMatching(/^https:\/\//),
      }),
    );
  });

  it("находит Vanilla Mace в подписи", () => {
    const match = matchCatalogProduct(
      "Vanilla Mace x Wildflower Cases phone case collaboration is live 💜",
      WILDFLOWERCASES_CATALOG,
    );

    expect(match?.label).toBe("Vanilla Mace");
  });

  it("находит Polka Dot | Turquoise and Black в подписи", () => {
    const match = matchCatalogProduct(
      "Polka Dot | Turquoise and Black iPhone Case — From $35 at wildflowercases.com",
      WILDFLOWERCASES_CATALOG,
    );

    expect(match?.label).toBe("Polka Dot | Turquoise and Black");
  });

  it("находит Ahoy Babe и Polka Dot без ложных совпадений по цвету", () => {
    const caption =
      "unboxing the new Ahoy Babe and Turquoise & Black Polkadot cases available now on wildflowercases.com";
    const matches = matchCatalogProducts(caption, WILDFLOWERCASES_CATALOG);

    expect(matches.map((product) => product.label)).toEqual([
      "Ahoy Babe",
      "Polka Dot | Turquoise and Black",
    ]);
  });
});

describe("matchCatalogProduct for MEUNDIES", () => {
  it("находит Moonwalk и Alien Arcade в подписи", () => {
    const caption =
      "Moonwalk + Alien Arcade have officially landed. shop meundies.com";
    const matches = matchCatalogProducts(caption, MEUNDIES_CATALOG);

    expect(matches.map((product) => product.label)).toEqual([
      "Moonwalk",
      "Alien Arcade",
    ]);
  });

  it("находит Jurassic Park x MeUndies в подписи", () => {
    const match = matchCatalogProduct(
      "Jurassic Park x MeUndies is BACK from extinction for a very limited time.",
      MEUNDIES_CATALOG,
    );

    expect(match?.label).toBe("Jurassic Park x MeUndies");
  });

  it("находит Plunge и Ruched Bralettes в подписи", () => {
    const caption =
      "Meet the newest members of the FeelFree family: our Plunge + Ruched Bralettes, now with sewn-in cups.";
    const matches = matchCatalogProducts(caption, MEUNDIES_CATALOG);

    expect(matches.map((product) => product.label)).toEqual([
      "FeelFree Plunge Bralette",
      "FeelFree Ruched Bralette",
    ]);
  });
});

describe("matchCatalogProduct for BROOKLINEN", () => {
  it("находит Best Sheets Ever в подписи кампании", () => {
    const match = matchCatalogProduct(
      "Labor Day is better from bed when you have the BEST. SHEETS. EVER.",
      BROOKLINEN_CATALOG,
    );

    expect(match?.label).toBe("Classic Percale Core Sheet Set");
  });

  it("находит Washed Classic и Heritage Wool в подписи", () => {
    const caption =
      "New Washed Classic in Desert Stripe in Avocado for warm summer nights, and a beautiful new Heritage Wool Throw in Algae for when things get cooler.";
    const matches = matchCatalogProducts(caption, BROOKLINEN_CATALOG);

    expect(matches.map((product) => product.label)).toEqual([
      "Desert Stripe Avocado",
      "Heritage Wool Throw",
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

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toEqual({
      kind: "link",
      label: "Магазин",
      url: "https://manekenbrand.com/",
    });
    expect(buttons[1]).toMatchObject({
      kind: "product",
      label: "Ветровка Urban Veil",
      url: "https://manekenbrand.com/catalog/new/vetrovka_urban_veil_siniy/",
      price: "24 000 ₽",
      imageUrl: expect.stringMatching(/^https:\/\//),
    });
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
