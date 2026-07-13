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

function createMarkerIcon(isSelected: boolean, isFeatured: boolean) {
  const color = isSelected ? "#0f172a" : isFeatured ? "#1d4ed8" : "#2563eb";
  const ring = isSelected ? "#f8fafc" : isFeatured ? "#60a5fa" : "#ffffff";
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

function getBarberCoords(barber: BarberMapItem, index: number): [number, number] {
  const lat = barber.shop.latitude != null ? Number(barber.shop.latitude) : null;
  const lng = barber.shop.longitude != null ? Number(barber.shop.longitude) : null;
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) {
    const coords: [number, number] = [lat, lng];
    if (isWithinKosovo(coords)) return coords;
  }

  const fallback = CITY_COORDS[barber.shop.city] ?? KOSOVO_CENTER;
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

function FitMapToBarbers({
  markers,
  selectedBarberId,
  markerRefs,
}: {
  markers: Array<{ barber: BarberMapItem; coords: [number, number] }>;
  selectedBarberId: number | null;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedBarberId) {
      const selected = markers.find((marker) => marker.barber.id === selectedBarberId);
      if (selected) {
        map.flyTo(selected.coords, 15, { duration: 0.8 });
        window.setTimeout(() => markerRefs.current.get(selectedBarberId)?.openPopup(), 450);
        return;
      }
    }

    if (markers.length === 0) {
      map.fitBounds(KOSOVO_BOUNDS, {
        padding: [24, 24],
        maxZoom: KOSOVO_MIN_ZOOM,
      });
      return;
    }

    if (markers.length === 1) {
      map.setView(markers[0].coords, 14);
      return;
    }

    map.fitBounds(markers.map((marker) => marker.coords), {
      padding: [48, 48],
      maxZoom: 14,
    });
  }, [map, markerRefs, markers, selectedBarberId]);

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
  onSelectBarber,
  onBookBarber,
}: BarberDirectoryMapProps) {
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());
  const safeBarbers = Array.isArray(barbers) ? barbers : [];
  const markers = useMemo(
    () => safeBarbers.map((barber, index) => ({ barber, coords: getBarberCoords(barber, index) })),
    [safeBarbers],
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
      <FitMapToBarbers markers={markers} selectedBarberId={selectedBarberId} markerRefs={markerRefs} />

      {markers.map(({ barber, coords }) => {
        const isSelected = barber.id === selectedBarberId;
        return (
          <Marker
            key={barber.id}
            position={coords}
            icon={createMarkerIcon(isSelected, Number(barber.rating ?? barber.shop.rating ?? 0) >= 4.7)}
            ref={(ref) => {
              if (ref) markerRefs.current.set(barber.id, ref);
              else markerRefs.current.delete(barber.id);
            }}
            eventHandlers={{ click: () => onSelectBarber(barber.id) }}
          >
            <Popup maxWidth={280} minWidth={240} className="leaflet-popup-trim">
              <div className="font-sans text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                    {barber.avatarUrl ? (
                      <img src={barber.avatarUrl} alt={barber.name} className="h-full w-full object-cover" />
                    ) : (
                      barber.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold leading-tight">{barber.name}</h3>
                    <p className="truncate text-xs font-semibold text-blue-600">{barber.shop.name}</p>
                  </div>
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-extrabold text-blue-600">
                    <Star className="h-3.5 w-3.5 fill-blue-600" />
                    {barber.rating != null ? Number(barber.rating).toFixed(1) : "New"}
                  </span>
                </div>

                {barber.specialties ? (
                  <p className="mt-3 text-xs text-slate-600">{barber.specialties}</p>
                ) : null}

                <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{barber.shop.address}, {barber.shop.city}</span>
                </p>

                {barber.shop.openTime ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3 shrink-0" />
                    {barber.shop.openTime} - {barber.shop.closeTime}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => onBookBarber(barber.shop.id)}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700"
                >
                  Rezervo ne kete dyqan
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
