import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

const CITY_COORDS: Record<string, [number, number]> = {
  Prishtina: [42.6629, 21.1655],
  Prizren: [42.2139, 20.7397],
  Peja: [42.6597, 20.288],
  Gjakova: [42.3803, 20.4308],
  Mitrovica: [42.8914, 20.866],
  Ferizaj: [42.3703, 21.1553],
  Gjilan: [42.4635, 21.4694],
};

const KOSOVO_CENTER: [number, number] = [42.6026, 20.902];
const KOSOVO_BOUNDS: L.LatLngBoundsExpression = [
  [41.84, 19.95],
  [43.35, 21.9],
];
const KOSOVO_LAT_LNG_BOUNDS = L.latLngBounds(KOSOVO_BOUNDS);
const KOSOVO_MIN_ZOOM = 9;

function isWithinKosovo(coords: [number, number]) {
  return KOSOVO_LAT_LNG_BOUNDS.contains(coords);
}

function createShopIcon(isSelected: boolean) {
  const color = isSelected ? "#0f172a" : "#2563eb";
  const ring = isSelected ? "#f8fafc" : "#ffffff";
  const size = isSelected ? 42 : 34;

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:3px solid ${ring};
        box-shadow:0 12px 26px rgba(15,23,42,.32);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <div style="
          transform:rotate(45deg);
          color:white;
          font-size:${isSelected ? 18 : 15}px;
          font-weight:800;
          line-height:1;
        ">✂</div>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function getShopCoords(
  shop: BarberMapItem["shop"],
  index: number,
): [number, number] {
  const lat = shop.latitude != null ? Number(shop.latitude) : null;
  const lng = shop.longitude != null ? Number(shop.longitude) : null;
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) {
    const coords: [number, number] = [lat, lng];
    if (isWithinKosovo(coords)) return coords;
  }
  const fallback = CITY_COORDS[shop.city] ?? KOSOVO_CENTER;
  const offset = (index % 8) * 0.004;
  return [fallback[0] + offset, fallback[1] + offset];
}

function KeepKosovoBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(KOSOVO_BOUNDS);
    map.setMinZoom(KOSOVO_MIN_ZOOM);
    map.options.maxBoundsViscosity = 1;
    if (!KOSOVO_LAT_LNG_BOUNDS.contains(map.getCenter())) {
      map.setView(KOSOVO_CENTER, KOSOVO_MIN_ZOOM);
    }
  }, [map]);
  return null;
}

function FitMapToShops({
  markers,
  selectedShopId,
  markerRefs,
}: {
  markers: Array<{ shopId: number; coords: [number, number] }>;
  selectedShopId: number | null;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedShopId) {
      const selected = markers.find((m) => m.shopId === selectedShopId);
      if (selected) {
        map.flyTo(selected.coords, 15, { duration: 0.8 });
        window.setTimeout(
          () => markerRefs.current.get(selectedShopId)?.openPopup(),
          450,
        );
        return;
      }
    }

    if (markers.length === 0) {
      map.fitBounds(KOSOVO_BOUNDS, { padding: [24, 24], maxZoom: KOSOVO_MIN_ZOOM });
      return;
    }

    if (markers.length === 1) {
      map.setView(markers[0].coords, 14);
      return;
    }

    map.fitBounds(
      markers.map((m) => m.coords),
      { padding: [48, 48], maxZoom: 14 },
    );
  }, [map, markerRefs, markers, selectedShopId]);

  return null;
}

interface BarberDirectoryMapProps {
  barbers: BarberMapItem[];
  selectedBarberId: number | null;
  onSelectBarber: (barberId: number) => void;
  onBookBarber: (shopId: number) => void;
}

export default function GoogleBarbershopMap({
  barbers = [],
  selectedBarberId,
  onBookBarber,
}: BarberDirectoryMapProps) {
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());
  const safeBarbers = Array.isArray(barbers) ? barbers : [];

  // Deduplicate: one entry per shop
  const shopMarkers = useMemo(() => {
    const seen = new Map<
      number,
      { shop: BarberMapItem["shop"]; coords: [number, number] }
    >();
    let index = 0;
    for (const barber of safeBarbers) {
      if (!seen.has(barber.shop.id)) {
        seen.set(barber.shop.id, {
          shop: barber.shop,
          coords: getShopCoords(barber.shop, index++),
        });
      }
    }
    return Array.from(seen.values());
  }, [safeBarbers]);

  // Map selectedBarberId → selectedShopId so the map still flies when a
  // barber is clicked in the list on the left.
  const selectedShopId = useMemo(() => {
    if (!selectedBarberId) return null;
    return (
      safeBarbers.find((b) => b.id === selectedBarberId)?.shop.id ?? null
    );
  }, [selectedBarberId, safeBarbers]);

  const fitMarkers = useMemo(
    () => shopMarkers.map((m) => ({ shopId: m.shop.id, coords: m.coords })),
    [shopMarkers],
  );

  return (
    <MapContainer
      center={KOSOVO_CENTER}
      zoom={KOSOVO_MIN_ZOOM}
      minZoom={KOSOVO_MIN_ZOOM}
      maxBounds={KOSOVO_BOUNDS}
      maxBoundsViscosity={1}
      zoomControl
      scrollWheelZoom
      className="absolute inset-0 z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        maxZoom={20}
        noWrap
      />

      <KeepKosovoBounds />
      <FitMapToShops
        markers={fitMarkers}
        selectedShopId={selectedShopId}
        markerRefs={markerRefs}
      />

      {shopMarkers.map(({ shop, coords }) => {
        const isSelected = shop.id === selectedShopId;
        return (
          <Marker
            key={shop.id}
            position={coords}
            icon={createShopIcon(isSelected)}
            ref={(ref) => {
              if (ref) markerRefs.current.set(shop.id, ref);
              else markerRefs.current.delete(shop.id);
            }}
          >
            <Popup maxWidth={260} minWidth={220} className="leaflet-popup-trim">
              <div className="font-sans text-slate-900">
                {shop.imageUrl ? (
                  <img
                    src={shop.imageUrl}
                    alt={shop.name}
                    className="mb-2 h-28 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="mb-2 flex h-20 w-full items-center justify-center rounded-xl bg-gray-100 text-2xl">
                    ✂️
                  </div>
                )}

                <h3 className="text-sm font-extrabold leading-tight">
                  {shop.name}
                </h3>

                <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {shop.address}, {shop.city}
                  </span>
                </p>

                {shop.openTime ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3 shrink-0" />
                    {shop.openTime} – {shop.closeTime}
                  </p>
                ) : null}

                {shop.rating != null ? (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
                    <span className="text-xs font-semibold">
                      {Number(shop.rating).toFixed(1)}
                    </span>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => onBookBarber(shop.id)}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700"
                >
                  Rezervo tani →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
