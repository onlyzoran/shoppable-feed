export function labelForUrl(url: string): string {
  const lower = url.toLowerCase();

  if (
    /book(ing)?|appoint|calendly|yclients|dikidi|fresha|запис/.test(lower)
  ) {
    return "Записаться";
  }

  if (/salon|beauty|spa|студия|салон|barber|nails|citynails|chopchop/.test(lower)) {
    return "Салон";
  }

  if (
    /shop|store|market|магазин|wildberries|ozon|etsy|amazon|lamoda|manekenbrand|madj\.store|dropsstore|thegrezway|bananhot|adahlazorgan|wildflowercases|meundies|brooklinen|limestore/.test(
      lower,
    )
  ) {
    return "Магазин";
  }

  if (
    /tour|travel|trip|aviasales|ostrovok|booking\.com\/hotel|тур/.test(lower)
  ) {
    return "Купить тур";
  }

  return "Сайт";
}
