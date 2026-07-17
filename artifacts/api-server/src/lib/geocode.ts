import { db, barbershopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Geocode a single address string → { lat, lng } or null if it fails.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const query = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json() as any;
    if (json.status !== "OK" || !json.results?.length) return null;
    const { lat, lng } = json.results[0].geometry.location;
    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * For any shops that have a null latitude/longitude, geocode their address
 * and persist the result to the DB. Fire-and-forget — does not block the response.
 */
export function geocodeMissingShops(shops: Array<{ id: number; address: string; city: string; latitude: number | null; longitude: number | null }>) {
  const missing = shops.filter(s => s.latitude == null || s.longitude == null);
  if (!missing.length) return;

  // Run in background — don't await
  (async () => {
    for (const shop of missing) {
      const fullAddress = `${shop.address}, ${shop.city}, Kosovo`;
      const coords = await geocodeAddress(fullAddress);
      if (!coords) continue;
      await db.update(barbershopsTable)
        .set({ latitude: coords.lat.toString(), longitude: coords.lng.toString() })
        .where(eq(barbershopsTable.id, shop.id));
    }
  })().catch(() => { /* silent — geocoding is best-effort */ });
}
