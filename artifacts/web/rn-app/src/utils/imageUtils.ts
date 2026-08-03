/**
 * Utility function to resolve the primary card image for a barbershop.
 * Priority:
 * 1. image_card / card_image
 * 2. portfolio_urls entry with category === 'Kartela'
 * 3. image_url / cover_image / image / imageUrl / avatar
 * 4. photos[0]
 * 5. portfolio_urls[0]
 * 6. Fallback default image
 */
export const getShopCardImage = (
  shop: any,
  fallback = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80"
): string => {
  if (!shop) return fallback;

  // 1. Direct card image fields
  if (shop.image_card && typeof shop.image_card === "string" && shop.image_card.trim()) {
    return shop.image_card.trim();
  }
  if (shop.card_image && typeof shop.card_image === "string" && shop.card_image.trim()) {
    return shop.card_image.trim();
  }

  // 2. Check portfolio_urls for item categorized as 'Kartela'
  if (Array.isArray(shop.portfolio_urls) && shop.portfolio_urls.length > 0) {
    const kartelaItem = shop.portfolio_urls.find(
      (p: any) => typeof p === "object" && p !== null && p.category === "Kartela" && p.url
    );
    if (kartelaItem && typeof kartelaItem.url === "string" && kartelaItem.url.trim()) {
      return kartelaItem.url.trim();
    }
  }

  // 3. General shop image fields
  if (shop.image_url && typeof shop.image_url === "string" && shop.image_url.trim()) {
    return shop.image_url.trim();
  }
  if (shop.cover_image && typeof shop.cover_image === "string" && shop.cover_image.trim()) {
    return shop.cover_image.trim();
  }
  if (shop.image && typeof shop.image === "string" && shop.image.trim()) {
    return shop.image.trim();
  }
  if (shop.imageUrl && typeof shop.imageUrl === "string" && shop.imageUrl.trim()) {
    return shop.imageUrl.trim();
  }
  if (shop.avatar && typeof shop.avatar === "string" && shop.avatar.trim()) {
    return shop.avatar.trim();
  }

  // 4. Check photos array
  if (Array.isArray(shop.photos) && shop.photos.length > 0 && shop.photos[0] && typeof shop.photos[0] === "string") {
    return shop.photos[0].trim();
  }

  // 5. First item in portfolio_urls
  if (Array.isArray(shop.portfolio_urls) && shop.portfolio_urls.length > 0 && shop.portfolio_urls[0]) {
    const p0 = shop.portfolio_urls[0];
    const url = typeof p0 === "string" ? p0 : p0.url;
    if (url && typeof url === "string" && url.trim()) {
      return url.trim();
    }
  }

  return fallback;
};
