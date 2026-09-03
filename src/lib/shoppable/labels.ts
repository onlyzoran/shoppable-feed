export function labelForUrl(url: string): string {
  const lower = url.toLowerCase();

  if (
    /book(ing)?|appoint|calendly|yclients|dikidi|fresha|запис/.test(lower)
  ) {
    return "Записаться";
  }

  if (
    /shop|store|market|магазин|wildberries|ozon|etsy|amazon|lamoda/.test(
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

  if (/salon|beauty|spa|студия|салон|barber|nails/.test(lower)) {
    return "Салон";
  }

  return "Сайт";
}
