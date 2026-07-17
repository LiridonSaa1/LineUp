import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { Clock, MapPin, Star } from "lucide-react";

export interface BarberMapItem {
  id: number;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  specialties?: string | null;
  rating?: number | null;
  shop: {
    id: number;
    name: string;
    city: string;
    address: string;
    imageUrl?: string | null;
    rating?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    openTime?: string | null;
    closeTime?: string | null;
  };
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Prishtina:  { lat: 42.6629, lng: 21.1655 },
  Prizren:    { lat: 42.2139, lng: 20.7397 },
  Peja:       { lat: 42.6597, lng: 20.2880 },
  Gjakova:    { lat: 42.3803, lng: 20.4308 },
  Mitrovica:  { lat: 42.8914, lng: 20.8660 },
  Ferizaj:    { lat: 42.3703, lng: 21.1553 },
  Gjilan:     { lat: 42.4635, lng: 21.4694 },
};
const KOSOVO_CENTER = { lat: 42.6026, lng: 20.902 };

function getShopCoords(shop: BarberMapItem["shop"], index: number) {
  const lat = shop.latitude != null ? Number(shop.latitude) : null;
  const lng = shop.longitude != null ? Number(shop.longitude) : null;
  if (lat && lng && Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  const fallback = CITY_COORDS[shop.city] ?? KOSOVO_CENTER;
  const offset = (index % 8) * 0.004;
  return { lat: fallback.lat + offset, lng: fallback.lng + offset };
}

function ShopPin({ selected }: { selected: boolean }) {
  const bg = selected ? "#0f172a" : "#2563eb";
  const size = selected ? 42 : 34;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        background: bg,
        border: "3px solid #ffffff",
        boxShadow: "0 8px 20px rgba(15,23,42,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <span style={{ transform: "rotate(45deg)", color: "#fff", fontSize: selected ? 18 : 14, fontWeight: 800, lineHeight: 1 }}>✂</span>
    </div>
  );
}

interface Props {
  barbers: BarberMapItem[];
  selectedBarberId: number | null;
  onSelectBarber: (barberId: number) => void;
  onBookBarber: (shopId: number) => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

export default function GoogleBarbershopMap({ barbers, selectedBarberId, onSelectBarber, onBookBarber }: Props) {
  const [openShopId, setOpenShopId] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Build unique shop groups with coords
  const shopGroups: Array<{ shop: BarberMapItem["shop"]; coords: { lat: number; lng: number } }> = [];
  const seen = new Set<number>();
  barbers.forEach((barber, i) => {
    if (!seen.has(barber.shop.id)) {
      seen.add(barber.shop.id);
      shopGroups.push({ shop: barber.shop, coords: getShopCoords(barber.shop, i) });
    }
  });

  const selectedBarber = barbers.find(b => b.id === selectedBarberId) ?? null;

  useEffect(() => {
    if (!selectedBarber || !mapRef.current) return;
    const group = shopGroups.find(g => g.shop.id === selectedBarber.shop.id);
    if (group) {
      mapRef.current.panTo(group.coords);
      mapRef.current.setZoom(15);
      setOpenShopId(selectedBarber.shop.id);
    }
  }, [selectedBarberId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedShopId = selectedBarber?.shop.id ?? null;

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={KOSOVO_CENTER}
        defaultZoom={9}
        mapId="barber-directory"
        gestureHandling="greedy"
        style={{ width: "100%", height: "100%" }}
        ref={(map: google.maps.Map | null) => { mapRef.current = map; }}
      >
        {shopGroups.map(({ shop, coords }) => {
          const isSelected = shop.id === selectedShopId;
          return (
            <AdvancedMarker
              key={shop.id}
              position={coords}
              zIndex={isSelected ? 10 : 1}
              onClick={() => {
                const firstBarber = barbers.find(b => b.shop.id === shop.id);
                if (firstBarber) onSelectBarber(firstBarber.id);
                setOpenShopId(shop.id);
              }}
            >
              <ShopPin selected={isSelected} />
            </AdvancedMarker>
          );
        })}

        {openShopId != null && (() => {
          const group = shopGroups.find(g => g.shop.id === openShopId);
          if (!group) return null;
          const { shop, coords } = group;
          return (
            <InfoWindow
              position={coords}
              onCloseClick={() => setOpenShopId(null)}
              pixelOffset={[0, -46]}
            >
              <div style={{ width: 200, fontFamily: "sans-serif" }}>
                {shop.imageUrl ? (
                  <img src={shop.imageUrl} alt={shop.name} style={{ width: "100%", height: 112, objectFit: "cover", borderRadius: 12, marginBottom: 8 }} />
                ) : (
                  <div style={{ width: "100%", height: 80, background: "#f1f5f9", borderRadius: 12, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✂️</div>
                )}
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>{shop.name}</h3>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                  📍 {shop.address}, {shop.city}
                </p>
                {shop.openTime && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>🕐 {shop.openTime} – {shop.closeTime}</p>
                )}
                {shop.rating != null && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600 }}>⭐ {Number(shop.rating).toFixed(1)}</p>
                )}
                <button
                  type="button"
                  onClick={() => onBookBarber(shop.id)}
                  style={{ marginTop: 10, width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  Rezervo tani →
                </button>
              </div>
            </InfoWindow>
          );
        })()}
      </Map>
    </APIProvider>
  );
}
