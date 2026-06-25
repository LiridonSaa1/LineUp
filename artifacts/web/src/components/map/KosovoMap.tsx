import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "wouter";
import { Star, MapPin, Clock } from "lucide-react";
import type { Barbershop } from "@workspace/api-client-react";

// Fix Leaflet default icon paths broken by bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Kosovo city centres — used as fallback when shop has no lat/lng
const CITY_COORDS: Record<string, [number, number]> = {
  Prishtina:  [42.6629, 21.1655],
  Prizren:    [42.2139, 20.7397],
  Peja:       [42.6597, 20.2880],
  Gjakova:    [42.3803, 20.4308],
  Mitrovica:  [42.8914, 20.8660],
  Ferizaj:    [42.3703, 21.1553],
  Gjilan:     [42.4635, 21.4694],
};

// Kosovo bounding box centre & default zoom
const KOSOVO_CENTER: [number, number] = [42.6026, 20.9020];
const DEFAULT_ZOOM = 9;

// Custom blue marker that matches the brand
function createCustomIcon(isActive = false) {
  return L.divIcon({
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${isActive ? "hsl(var(--primary))" : "#2563eb"};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      ">
        <div style="
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          transform: rotate(45deg);
          font-size: 13px;
        ">✂</div>
      </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

// Fly to Kosovo when the selected city changes
function FlyToCity({ city }: { city: string }) {
  const map = useMap();
  useEffect(() => {
    if (city === "all") {
      map.flyTo(KOSOVO_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
    } else {
      const coords = CITY_COORDS[city];
      if (coords) map.flyTo(coords, 12, { duration: 1.2 });
    }
  }, [city, map]);
  return null;
}

interface KosovoMapProps {
  shops: Barbershop[];
  selectedCity: string;
  searchQuery: string;
  onShopClick?: (shopId: number) => void;
}

export default function KosovoMap({
  shops,
  selectedCity,
  searchQuery,
  onShopClick,
}: KosovoMapProps) {
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());

  // Filter + resolve coordinates
  const markers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return shops
      .filter((s) => {
        const matchCity = selectedCity === "all" || s.city === selectedCity;
        const matchSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q);
        return matchCity && matchSearch;
      })
      .map((s) => {
        const lat = s.latitude != null ? Number(s.latitude) : null;
        const lng = s.longitude != null ? Number(s.longitude) : null;
        const coords: [number, number] =
          lat && lng ? [lat, lng] : (CITY_COORDS[s.city] ?? KOSOVO_CENTER);
        return { shop: s, coords };
      });
  }, [shops, selectedCity, searchQuery]);

  return (
    <MapContainer
      center={KOSOVO_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      {/* OpenStreetMap tiles — no API key required */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <FlyToCity city={selectedCity} />

      {markers.map(({ shop, coords }) => (
        <Marker
          key={shop.id}
          position={coords}
          icon={createCustomIcon()}
          ref={(ref) => {
            if (ref) markerRefs.current.set(shop.id, ref);
            else markerRefs.current.delete(shop.id);
          }}
          eventHandlers={{
            click: () => onShopClick?.(shop.id),
          }}
        >
          <Popup
            className="leaflet-popup-trim"
            maxWidth={260}
            minWidth={220}
          >
            <div className="p-1 font-sans">
              {/* Shop image or placeholder */}
              {shop.imageUrl ? (
                <img
                  src={shop.imageUrl}
                  alt={shop.name}
                  className="w-full h-28 object-cover rounded-xl mb-2"
                />
              ) : (
                <div className="w-full h-20 rounded-xl bg-gray-100 flex items-center justify-center mb-2 text-2xl">
                  ✂️
                </div>
              )}

              <h3 className="font-bold text-sm leading-tight mb-1">{shop.name}</h3>

              <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{shop.address}, {shop.city}</span>
              </p>

              {shop.openTime && (
                <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Clock className="w-3 h-3 shrink-0" />
                  {shop.openTime} – {shop.closeTime}
                </p>
              )}

              {shop.rating != null && (
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                  <span className="text-xs font-semibold">{Number(shop.rating).toFixed(1)}</span>
                  {shop.totalReviews ? (
                    <span className="text-[10px] text-gray-400">({shop.totalReviews})</span>
                  ) : null}
                </div>
              )}

              <Link
                href={`/barbershops/${shop.id}`}
                className="block w-full text-center text-xs font-semibold py-2 px-4 rounded-lg text-white"
                style={{ background: "hsl(var(--primary))" }}
              >
                Rezervo tani →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
