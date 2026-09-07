import { describe, expect, it } from "vitest";

import { buildStoreProductSearchUrl } from "./build-store-url";
import {
  extractProductHeadline,
  truncateButtonLabel,
} from "./extract-product-headline";

describe("extractProductHeadline", () => {
  it("берёт первую строку подписи как название", () => {
    expect(
      extractProductHeadline(
        "POLKA DOT PRINT\n\nDiscover new arrivals from the LIMÉ underwear collection.",
      ),
    ).toBe("POLKA DOT PRINT");
  });

  it("возвращает null для пустой подписи", () => {
    expect(extractProductHeadline("   ")).toBeNull();
  });
});

describe("buildStoreProductSearchUrl", () => {
  it("строит поиск на сайте магазина (Shopify-стиль)", () => {
    expect(
      buildStoreProductSearchUrl(
        "https://limestore.com/ru_ru",
        "POLKA DOT PRINT",
      ),
    ).toBe(
      "https://limestore.com/ru_ru/search?q=POLKA+DOT+PRINT&type=product",
    );
  });

  it("строит поиск в каталоге MANEKEN", () => {
    expect(
      buildStoreProductSearchUrl("https://manekenbrand.com", "КОСТЮМ CHAMPION"),
    ).toBe("https://manekenbrand.com/catalog/?q=%D0%9A%D0%9E%D0%A1%D0%A2%D0%AE%D0%9C+CHAMPION");
  });
});

describe("truncateButtonLabel", () => {
  it("обрезает длинные названия", () => {
    expect(truncateButtonLabel("A".repeat(40), 32)).toBe(`${"A".repeat(31)}…`);
  });
});
