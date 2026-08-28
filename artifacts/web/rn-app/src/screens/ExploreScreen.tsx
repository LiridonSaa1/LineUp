import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform, RefreshControl, useWindowDimensions } from "react-native";
import { Search, MapPin, List, Map as MapIcon, Star, Heart, ArrowUpRight, ChevronDown, Check, SlidersHorizontal, Layers, Sparkles, Store } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS
} from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { supabase } from "../config/supabase";
import { getShopCardImage } from "../utils/imageUtils";
import { WebFooter } from "../components/WebFooter";
import { DEFAULT_SUBCATEGORIES } from "../config/defaultCategories";
import * as Haptics from 'expo-haptics';

let RNWebView: any = null;
if (Platform.OS !== 'web') {
  try {
    RNWebView = require('react-native-webview').WebView;
  } catch (e) {
    // Suppress warning
  }
}

// Dimensions moved inside components to support responsiveness

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "prishtin": { lat: 42.6629, lng: 21.1655 },
  "ferizaj": { lat: 42.3703, lng: 21.1559 },
  "prizren": { lat: 42.2139, lng: 20.7397 },
  "pej": { lat: 42.6593, lng: 20.2883 },
  "gjakov": { lat: 42.3803, lng: 20.4308 },
  "gjilan": { lat: 42.4635, lng: 21.4678 },
  "mitrovic": { lat: 42.8914, lng: 20.8660 },
  "fushe kosov": { lat: 42.6340, lng: 21.0963 },
  "vushtrr": { lat: 42.8231, lng: 20.9675 },
  "podujev": { lat: 42.9114, lng: 21.1903 },
  "rahovec": { lat: 42.3994, lng: 20.6553 },
  "skenderaj": { lat: 42.7478, lng: 20.7878 },
  "lipjan": { lat: 42.5217, lng: 21.1258 },
  "suharek": { lat: 42.3581, lng: 20.8250 },
  "therand": { lat: 42.3581, lng: 20.8250 },
  "decan": { lat: 42.5353, lng: 20.2878 },
  "istog": { lat: 42.7808, lng: 20.4875 },
  "klin": { lat: 42.6225, lng: 20.5786 },
  "kacanik": { lat: 42.2319, lng: 21.2594 },
  "dragash": { lat: 42.0622, lng: 20.6533 },
  "malishev": { lat: 42.4822, lng: 20.7458 },
  "drenas": { lat: 42.6264, lng: 20.8878 },
  "gllogoc": { lat: 42.6264, lng: 20.8878 },
  "kamenic": { lat: 42.5781, lng: 21.5803 },
  "dardan": { lat: 42.5781, lng: 21.5803 },
  "shtime": { lat: 42.4331, lng: 21.0397 },
  "viti": { lat: 42.3214, lng: 21.3583 },
};

const normalizeCity = (city: string) => {
  if (!city) return "";
  let clean = city.toLowerCase().trim().replace(/ë/g, "e").replace(/ç/g, "c").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
  if (clean.startsWith("prishtin")) return "prishtin";
  if (clean.startsWith("prizren")) return "prizren";
  if (clean.startsWith("ferizaj")) return "ferizaj";
  if (clean.startsWith("pej")) return "pej";
  if (clean.startsWith("gjakov")) return "gjakov";
  if (clean.startsWith("gjilan")) return "gjilan";
  if (clean.startsWith("mitrovic")) return "mitrovic";
  if (clean.startsWith("fushe")) return "fushe kosov";
  if (clean.startsWith("vushtrr")) return "vushtrr";
  if (clean.startsWith("podujev")) return "podujev";
  if (clean.startsWith("rahovec")) return "rahovec";
  if (clean.startsWith("skenderaj")) return "skenderaj";
  if (clean.startsWith("lipjan")) return "lipjan";
  if (clean.startsWith("suharek") || clean.startsWith("therand")) return "suharek";
  if (clean.startsWith("decan")) return "decan";
  if (clean.startsWith("istog")) return "istog";
  if (clean.startsWith("klin")) return "klin";
  return clean;
};

const getShopCityName = (shop: any) => {
  if (shop?.city && typeof shop.city === 'string' && shop.city.trim().length > 0) return shop.city.trim();
  const fullAddr = (shop?.formatted_address || shop?.address || shop?.location || "").toLowerCase();
  for (const key of Object.keys(CITY_COORDS)) { if (fullAddr.includes(key)) return key; }
  return "";
};

const getCoordsForCity = (cityName: string) => {
  const normalizedSearch = normalizeCity(cityName);
  if (!normalizedSearch) return CITY_COORDS["prishtin"];
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (key === normalizedSearch || normalizedSearch.includes(key) || key.includes(normalizedSearch)) return coords;
  }
  return CITY_COORDS["prishtin"];
};

const getShopCoords = (shop: any, index: number) => {
  const rawLat = shop?.latitude != null ? parseFloat(String(shop.latitude)) : NaN;
  const rawLng = shop?.longitude != null ? parseFloat(String(shop.longitude)) : NaN;
  const detectedCity = getShopCityName(shop);
  const normalizedCity = normalizeCity(detectedCity);
  const isDefaultPrishtinaCoords = Math.abs(rawLat - 42.6629) < 0.001 && Math.abs(rawLng - 21.1655) < 0.001;
  if (!isNaN(rawLat) && !isNaN(rawLng) && rawLat > 41.0 && rawLat < 43.5 && rawLng > 19.0 && rawLng < 22.5 && (!isDefaultPrishtinaCoords || normalizedCity === "prishtin")) {
    return { lat: rawLat, lng: rawLng };
  }
  const baseCoords = getCoordsForCity(detectedCity);
  const angle = (index * 137.5) * (Math.PI / 180);
  const distance = 0.0035 + (index % 6) * 0.0015;
  const latOffset = Math.sin(angle) * distance;
  const lngOffset = Math.cos(angle) * distance;
  return { lat: baseCoords.lat + latOffset, lng: baseCoords.lng + lngOffset };
};

const logoImg = require('../../assets/logo.png');
const extractUri = (mod: any): string => {
  if (!mod) return "";
  if (typeof mod === "string") return mod;
  if (typeof mod === "object") {
    if (typeof mod.default === "string") return mod.default;
    if (mod.default && typeof mod.default === "object" && typeof mod.default.uri === "string") return mod.default.uri;
    if (typeof mod.uri === "string") return mod.uri;
    if (typeof mod.src === "string") return mod.src;
  }
  return String(mod || "");
};

interface ExploreScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenSearch: () => void;
  initialCity?: string;
  initialSearch?: string;
  initialCoords?: { lat?: number; lng?: number };
  initialSubIds?: string[];
  initialCategoryName?: string;
  initialDate?: string;
  initialTime?: string;
  favorites?: any[];
  onToggleFavorite?: (shop: any) => void;
  onNavigateTab?: (tabIndex: number) => void;
  selectedLocation?: string;
  onOpenLocation?: () => void;
  onOpenRegisterShop?: () => void;
}

const INITIAL_REGION = { lat: 42.5500, lng: 20.8500, zoom: 9 };

const LeafletMapView = ({ shops, onSelectShop, initialCity, mapType, initialCoords, width, height }: { shops: any[], onSelectShop: (shop: any) => void, initialCity?: string, mapType: 'standard' | 'satellite', initialCoords?: { lat?: number; lng?: number }, width: number, height: number }) => {
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<any>(null);

  const markersData = shops.map((shop, index) => {
    const coords = getShopCoords(shop, index);
    return {
      id: shop.id,
      name: shop.name || "Berberi",
      address: shop.address || shop.city || "Kosova",
      city: shop.city || "Kosovë",
      rating: shop.rating ? parseFloat(String(shop.rating)).toFixed(1) : "0.0",
      imageUrl: getShopCardImage(shop),
      lat: coords.lat,
      lng: coords.lng,
    };
  });

  const isDefaultView = !initialCity || initialCity === "Të gjitha" || initialCity === "Lokacioni aktual";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .custom-pin {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border: 3px solid #ffffff; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 16px rgba(0,0,0,0.4); cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease;
    }
    .custom-pin:hover { transform: rotate(-45deg) scale(1.25); background: linear-gradient(135deg, #ef4444, #dc2626); }
    .pin-icon { transform: rotate(45deg); color: #ffffff; font-size: 16px; font-weight: bold; user-select: none; }
    .leaflet-popup-content-wrapper { border-radius: 20px; padding: 0; overflow: hidden; box-shadow: 0 20px 35px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); }
    .leaflet-popup-content { margin: 0 !important; width: 220px !important; }
    .popup-card { background: #ffffff; padding: 12px; }
    .popup-img { width: 100%; height: 100px; object-fit: cover; border-radius: 12px; margin-bottom: 8px; }
    .popup-title { font-weight: 800; font-size: 14px; color: #0f172a; margin: 0 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .popup-subtitle { font-size: 11px; color: #64748b; margin-bottom: 8px; }
    .popup-badge { display: inline-flex; align-items: center; background: #fef3c7; color: #d97706; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 6px; margin-bottom: 8px; }
    .popup-btn { width: 100%; background: #2563eb; color: #ffffff; border: none; border-radius: 10px; padding: 8px 0; font-weight: 800; font-size: 12px; cursor: pointer; text-align: center; transition: background 0.2s; }
    .popup-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const shops = ${JSON.stringify(markersData)};
    const map = L.map('map', { center: [42.5500, 20.8500], zoom: 9, zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const standardTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 19 });
    const satelliteTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });

    if ('${mapType}' === 'satellite') satelliteTiles.addTo(map); else standardTiles.addTo(map);

    function updateView(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 15, { animate: true, duration: 1.5 });
    }

    window.addEventListener('message', (e) => {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data.type === 'MOVE_TO') updateView(data.lat, data.lng, data.zoom);
      if (data.type === 'SET_MAP_TYPE') {
        if (data.mapType === 'satellite') { map.removeLayer(standardTiles); satelliteTiles.addTo(map); }
        else { map.removeLayer(satelliteTiles); standardTiles.addTo(map); }
      }
    });

    function sendMsg(msgObj) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) window.ReactNativeWebView.postMessage(JSON.stringify(msgObj));
      else if (window.parent && window.parent.postMessage) window.parent.postMessage(msgObj, '*');
    }

    shops.forEach(shop => {
      const icon = L.divIcon({
        className: 'leaflet-data-marker',
        html: '<div class="custom-pin" id="pin-' + shop.id + '"><span class="pin-icon">✂</span></div>',
        iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38]
      });
      const popupHtml = \`
        <div class="popup-card">
          <img src="\${shop.imageUrl}" class="popup-img" />
          <div class="popup-title">\${shop.name}</div>
          <div class="popup-subtitle">📍 \${shop.address}</div>
          <div class="popup-badge">⭐ \${shop.rating}</div>
          <button class="popup-btn" onclick="sendMsg({ type: 'SELECT_SHOP', shopId: '\${shop.id}' })">Rezervo →</button>
        </div>\`;
      L.marker([shop.lat, shop.lng], { icon }).bindPopup(popupHtml).addTo(map);
    });
  </script>
</body>
</html>
  `;

  useEffect(() => {
    const postMsg = (msg: any) => {
      if (Platform.OS === 'web' && iframeRef.current) iframeRef.current.contentWindow.postMessage(msg, '*');
      else if (webViewRef.current) webViewRef.current.postMessage(JSON.stringify(msg));
    };

    if (initialCoords?.lat && initialCoords?.lng) {
      postMsg({ type: 'MOVE_TO', lat: initialCoords.lat, lng: initialCoords.lng, zoom: 15 });
    } else if (initialCity && initialCity !== "Të gjitha" && initialCity !== "Lokacioni aktual") {
      const coords = getCoordsForCity(initialCity);
      postMsg({ type: 'MOVE_TO', lat: coords.lat, lng: coords.lng, zoom: 13 });
    } else if (isDefaultView) {
      postMsg({ type: 'MOVE_TO', lat: INITIAL_REGION.lat, lng: INITIAL_REGION.lng, zoom: INITIAL_REGION.zoom });
    }
  }, [initialCity, initialCoords]);

  useEffect(() => {
    if (Platform.OS === 'web' && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_MAP_TYPE', mapType }, '*');
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'SET_MAP_TYPE', mapType }));
    }
  }, [mapType]);

  const onMsg = (event: any) => {
    try {
      const data = Platform.OS === 'web' ? event.data : JSON.parse(event.nativeEvent.data);
      if (data && (data.type === 'SELECT_SHOP' || data.type === 'MARKER_CLICK')) {
        const target = shops.find(s => String(s.id) === String(data.shopId));
        if (target) onSelectShop(target);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('message', onMsg);
      return () => window.removeEventListener('message', onMsg);
    }
  }, [shops, onSelectShop]);

  if (Platform.OS === 'web') {
    return React.createElement('iframe', {
      ref: iframeRef, srcDoc: htmlContent,
      style: { width: '100%', height: '100%', border: 'none' }
    });
  }

  if (RNWebView) {
    return (
      <RNWebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }}
        onMessage={onMsg}
      />
    );
  }

  return (
    <View style={{ width, height }} className="items-center justify-center bg-slate-900 p-6">
      <MapIcon size={48} color="#3473ef" />
      <Text className="text-white font-black text-xl mt-3">Harta e Berberive</Text>
    </View>
  );
};

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onSelectShop, onOpenSearch, initialCity = "Të gjitha", initialSearch = "", initialCoords, initialSubIds = [], initialCategoryName = "", initialDate = "Anytime", initialTime = "Anytime", favorites = [], onToggleFavorite, onNavigateTab, selectedLocation, onOpenLocation, onOpenRegisterShop
}) => {
  const { width, height } = useWindowDimensions();
  const SHEET_MIN_HEIGHT = height * 0.35;
  const SHEET_MAX_HEIGHT = height - 160;

  const [shops, setShops] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [filteredShops, setFilteredShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    let result = [...shops];

    // 1. City Filter
    const cleanCity = normalizeCity(initialCity);
    if (cleanCity && cleanCity !== normalizeCity("të gjitha") && cleanCity !== normalizeCity("lokacioni aktual")) {
      result = result.filter(shop => {
        const detected = normalizeCity(getShopCityName(shop));
        const addrMatch = normalizeCity(shop.address || shop.formatted_address || "").includes(cleanCity);
        return detected === cleanCity || addrMatch;
      });
    }

    // 2. Category/Subcategory Filter
    const activeSubIds = (initialSubIds || []).filter(id => id && id.toString().trim().length > 0).map(id => String(id).trim().toLowerCase());
    const searchCatName = String(initialCategoryName || "").toLowerCase().trim();
    const hasCategoryFilter = activeSubIds.length > 0 || searchCatName.length > 0;

    if (hasCategoryFilter) {
      const matchedSubNames = DEFAULT_SUBCATEGORIES
        .filter(s => activeSubIds.includes(String(s.id).toLowerCase()) || activeSubIds.includes(String(s.category_id).toLowerCase()))
        .map(s => s.name.toLowerCase());

      result = result.filter(shop => {
        // A) Check shop.subcategories
        const shopSubList = Array.isArray(shop.subcategories) 
          ? shop.subcategories.map((item: any) => String(typeof item === 'object' ? (item.id || item.name || '') : item).trim().toLowerCase())
          : [];

        const matchesSubId = activeSubIds.length > 0 && shopSubList.some((sub: string) => 
          activeSubIds.includes(sub) || matchedSubNames.some(name => sub.includes(name) || name.includes(sub))
        );

        // B) Check shop.category / shop.category_name
        const shopCategoryStr = String(shop.category || shop.category_name || shop.categoryName || "").toLowerCase().trim();
        const matchesCategory = searchCatName && (
          shopCategoryStr.includes(searchCatName) || searchCatName.includes(shopCategoryStr)
        );

        // C) Check shop.services list
        const shopServicesList = Array.isArray(shop.services)
          ? shop.services.map((srv: any) => String(typeof srv === 'object' ? (srv.name || srv.title || srv.category || '') : srv).toLowerCase().trim())
          : [];

        const matchesService = (searchCatName || matchedSubNames.length > 0) && shopServicesList.some((srv: string) => {
          if (searchCatName && (srv.includes(searchCatName) || searchCatName.includes(srv))) return true;
          if (matchedSubNames.some(n => srv.includes(n) || n.includes(srv))) return true;
          return false;
        });

        // D) Check keyword in shop name or description
        const matchesKeywordInShop = searchCatName && (
          String(shop.name || "").toLowerCase().includes(searchCatName) ||
          String(shop.description || "").toLowerCase().includes(searchCatName)
        );

        return matchesSubId || matchesCategory || matchesService || matchesKeywordInShop;
      });
    }

    // 3. Search Query Filter
    if (initialSearch && initialSearch.trim().length > 0) {
      const cleanSearch = initialSearch.toLowerCase().trim();
      result = result.filter(shop => {
        const nameMatch = shop.name?.toLowerCase().includes(cleanSearch);
        const cityMatch = shop.city?.toLowerCase().includes(cleanSearch);
        const addressMatch = shop.address?.toLowerCase().includes(cleanSearch);
        return nameMatch || cityMatch || addressMatch;
      });
    }

    // 4. Working Hours (Date/Time) Filter
    if (initialDate && initialDate !== "Anytime" && initialDate !== "Kurdoherë") {
      let targetDayIdx: number | null = null;

      const now = new Date();
      if (initialDate === "Sot") {
        // Mock date from SearchScreen is July 22, 2026
        // But let's use real index based on July 22, 2026 if it's that specific string
        // Actually SearchScreen sends "Sot" but it sets currentCalendarDate to new Date(2026, 6, 22)
        // Wait, SearchScreen line 671: setSelectedDate("Sot");
        targetDayIdx = (new Date(2026, 6, 22).getDay() + 6) % 7; // Monday-based
      } else if (initialDate === "Nesër") {
        targetDayIdx = (new Date(2026, 6, 23).getDay() + 6) % 7;
      } else {
        // Format: "D Month YYYY"
        const parts = initialDate.split(" ");
        if (parts.length >= 3) {
          const day = parseInt(parts[0]);
          const monthStr = parts[1];
          const year = parseInt(parts[2]);
          const monthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(monthStr);
          if (day && monthIdx !== -1 && year) {
            const date = new Date(year, monthIdx, day);
            targetDayIdx = (date.getDay() + 6) % 7;
          }
        }
      }

      if (targetDayIdx !== null) {
        result = result.filter(shop => {
          const shopIdStr = String(shop.id || "").trim();

          // Find schedule for this shop and day
          const shopSchedule = schedules.find(s => {
            const bId = String(s.barber_id || "").trim();
            const sId = String(s.shop_id || "").trim();
            return (bId === shopIdStr || sId === shopIdStr) && s.day_of_week === targetDayIdx;
          });

          // 1. If schedule exists and is_closed is true, filter out
          // 2. If NO schedule exists and it's Sunday (6), filter out (default closed)
          if (shopSchedule) {
            if (shopSchedule.is_closed) return false;
          } else if (targetDayIdx === 6) {
            return false;
          }

          // Time Slot Filtering
          if (initialTime && initialTime !== "Anytime" && initialTime !== "Kurdoherë") {
            // slots: 'Mëngjes' (09-12), 'Pasdite' (12-18), 'Mbrëmje' (18-00)
            const slotRange =
              initialTime === 'Mëngjes' ? { start: 9, end: 12 } :
              initialTime === 'Pasdite' ? { start: 12, end: 18 } :
              initialTime === 'Mbrëmje' ? { start: 18, end: 24 } : null;

            if (slotRange && shopSchedule) {
              const shopStart = parseInt(shopSchedule.start_time?.split(':')[0] || "0");
              const shopEnd = parseInt(shopSchedule.end_time?.split(':')[0] || "24");

              // Shop must be open during at least part of the selected slot
              const overlaps = Math.max(slotRange.start, shopStart) < Math.min(slotRange.end, shopEnd);
              if (!overlaps) return false;
            }
          }

          return true;
        });
      }
    }

    setFilteredShops(result);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [shops, schedules, initialCity, initialSearch, initialSubIds, initialCategoryName, initialDate, initialTime]);

  const translateY = useSharedValue(height - SHEET_MIN_HEIGHT);
  const context = useSharedValue(0);

  // Handle orientation changes / window resizing
  useEffect(() => {
    if (!isExpanded) {
      translateY.value = withTiming(height - SHEET_MIN_HEIGHT);
    } else {
      translateY.value = withTiming(height - SHEET_MAX_HEIGHT);
    }
  }, [height, SHEET_MIN_HEIGHT, SHEET_MAX_HEIGHT]);

  const toggleSheet = (expand?: boolean) => {
    'worklet';
    const currentVal = translateY.value;
    const shouldExpand = expand !== undefined ? expand : currentVal > (height - SHEET_MAX_HEIGHT + 100);
    if (shouldExpand) {
      translateY.value = withTiming(height - SHEET_MAX_HEIGHT, { duration: 150 });
      runOnJS(setIsExpanded)(true);
    } else {
      translateY.value = withTiming(height - SHEET_MIN_HEIGHT, { duration: 150 });
      runOnJS(setIsExpanded)(false);
    }
  };

  const gesture = Gesture.Pan().onStart(() => { context.value = translateY.value; }).onUpdate((event) => {
    translateY.value = Math.max(Math.min(event.translationY + context.value, height - SHEET_MIN_HEIGHT), height - SHEET_MAX_HEIGHT);
  }).onEnd(() => {
    const midPoint = ( (height - SHEET_MIN_HEIGHT) + (height - SHEET_MAX_HEIGHT) ) / 2;
    if (translateY.value < midPoint) { translateY.value = withTiming(height - SHEET_MAX_HEIGHT); runOnJS(setIsExpanded)(true); }
    else { translateY.value = withTiming(height - SHEET_MIN_HEIGHT); runOnJS(setIsExpanded)(false); }
  });

  const rBottomSheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const [refreshing, setRefreshing] = useState(false);

  const loadShops = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true); else setLoading(true);
    try {
      const [
        { data: shopsData },
        { data: barbersData },
        { data: scheduleData }
      ] = await Promise.all([
        supabase.from('barbershops').select('*').eq('status', 'active'),
        supabase.from('barbers').select('*'),
        supabase.from('barber_schedules').select('*')
      ]);

      const combined = [...(shopsData || [])];
      if (barbersData) barbersData.forEach((b: any) => { if (!combined.some(s => s.id === b.shop_id || s.id === b.id)) combined.push(b); });

      setShops(combined);
      setSchedules(scheduleData || []);
    } catch (e) { console.warn(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadShops(); }, [loadShops]);
  const onRefresh = () => { loadShops(true); try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {} };

  const [stats, setStats] = useState({
    shopsCount: "450+",
    appointmentsCount: "28k",
    avgRating: "4.9"
  });

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const { count: sCount } = await supabase.from('barbershops').select('id', { count: 'exact', head: true }).eq('status', 'active');
        const { count: aCount } = await supabase.from('appointments').select('id', { count: 'exact', head: true });
        const { data: shopsData } = await supabase.from('barbershops').select('rating').eq('status', 'active');

        let formattedShops = sCount && sCount > 0 ? `${sCount}` : "450+";
        let formattedAppts = aCount && aCount > 0 ? (aCount > 1000 ? `${(aCount / 1000).toFixed(1)}k` : `${aCount}`) : "28k";
        let avgRatingStr = "4.9";

        if (shopsData && shopsData.length > 0) {
          const ratings = shopsData.map(s => parseFloat(s.rating || "0")).filter(r => r > 0);
          if (ratings.length > 0) {
            const sum = ratings.reduce((acc, curr) => acc + curr, 0);
            avgRatingStr = (sum / ratings.length).toFixed(1);
          }
        }

        setStats({
          shopsCount: formattedShops,
          appointmentsCount: formattedAppts,
          avgRating: avgRatingStr
        });
      } catch (err) {
        console.warn("[ExploreScreen] Error fetching real stats:", err);
      }
    };

    fetchRealStats();
  }, []);

  const isDesktop = Platform.OS === 'web' && width > 768;

  if (isDesktop) {
    return (
      <View className="flex-1 bg-[#f8fafc] flex-col items-center overflow-y-auto">
        {Platform.OS === 'web' && (
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Space+Grotesk:wght@300..700&display=swap');
            
            body, button, input, select, textarea, span, p, div {
              font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
            
            h1, h2, h3, h4, h5, h6, .font-display, [class*="font-black"], [class*="font-bold"], [class*="font-extrabold"], [class*="font-semibold"] {
              font-family: 'Space Grotesk', 'DM Sans', sans-serif !important;
            }
          `}</style>
        )}
        {/* TOP HERO BANNER & REAL STATS ABOVE BOTH MAP & CARDS */}
        <View className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 pt-8 pb-4">
          <View className="flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-6">
            <View className="max-w-2xl">
              <Text className="font-display text-2xl font-black text-slate-900 leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Rezervo termin te berberi më i mirë në Kosovë
              </Text>
              <Text className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                Shfleto sallonet, zgjidh orën që të përshtatet dhe konfirmo me OTP — pa telefonata.
              </Text>
            </View>

            {/* REAL DYNAMIC STATS BADGES */}
            <View className="flex-row items-center gap-6 rounded-2xl bg-white border border-slate-200/80 px-6 py-4 shadow-2xs">
              <View className="items-center">
                <Text className="font-display text-2xl font-black text-slate-900">{stats.shopsCount}</Text>
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sallone</Text>
              </View>
              <View className="h-8 w-[1px] bg-slate-200" />
              <View className="items-center">
                <Text className="font-display text-2xl font-black text-slate-900">{stats.appointmentsCount}</Text>
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Termine</Text>
              </View>
              <View className="h-8 w-[1px] bg-slate-200" />
              <View className="items-center">
                <Text className="font-display text-2xl font-black text-[#3473ef]">{stats.avgRating}</Text>
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vlerësim</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Desktop Split Screen Content - Centered to max-w-[1440px] px-6 lg:px-10 matching Homepage */}
        <View className="mx-auto flex-row w-full max-w-[1440px] px-6 lg:px-10 gap-6 h-[calc(100vh-250px)] min-h-[550px] relative pb-6">
          {/* Left Side: Barbershop Cards Rail */}
          <View className="w-[480px] bg-white border border-slate-200/80 rounded-3xl flex-col h-full overflow-hidden shadow-xs">
            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

              {/* SEARCH INPUT BAR ABOVE CARDS LIST */}
              <View className="mb-6 flex-col gap-3">
                <TouchableOpacity 
                  onPress={onOpenSearch} 
                  activeOpacity={0.8}
                  className="flex-row items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 px-4 py-3"
                >
                  <Search size={20} color="#94a3b8" />
                  <Text className="flex-1 truncate text-sm font-medium text-slate-600">
                    {initialSearch || initialCategoryName || "Kërko sallone, trajtime..."}
                  </Text>
                  {initialCity && initialCity !== "Të gjitha" && (
                    <View className="flex-row items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 border border-blue-100">
                      <MapPin size={12} color="#3473ef" />
                      <Text className="text-xs font-bold text-[#3473ef]">{initialCity}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-display text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  SALLONET E REKOMANDUARA NË HARTË
                </Text>
                <View className="rounded-full bg-slate-100 px-3 py-1 flex-row items-center">
                  <Text className="text-xs font-bold text-slate-600">
                    <Text className="text-[#3473ef] font-bold">{filteredShops.length}</Text> sallone
                  </Text>
                </View>
              </View>

              {loading ? (
                <View className="py-20 items-center justify-center">
                  <ActivityIndicator size="large" color="#3473ef" />
                  <Text className="text-slate-500 font-display font-bold text-sm mt-4">Duke ngarkuar harta & sallonet...</Text>
                </View>
              ) : filteredShops.length === 0 ? (
                <View className="items-center justify-center py-20 px-6">
                  <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                    <Search size={28} color="#8789A3" />
                  </View>
                  <Text className="font-display text-lg font-bold text-slate-900 text-center">Nuk u gjet asnjë sallon në këtë zonë</Text>
                </View>
              ) : (
                filteredShops.map((shop, i) => {
                  const isFav = favorites?.some(f => f.shop_id === shop.id || f.shop_id === Number(shop.id));
                  return (
                    <TouchableOpacity 
                      key={shop.id || i} 
                      onPress={() => onSelectShop(shop)}
                      activeOpacity={0.8}
                      className="mb-4 flex-row items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-xs"
                    >
                      {/* Left: Compact Thumbnail Image */}
                      <View className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-32 sm:w-32">
                        <Image 
                          source={{ uri: getShopCardImage(shop) }} 
                          className="h-full w-full rounded-2xl" 
                          resizeMode="cover"
                        />
                        <TouchableOpacity 
                          onPress={() => onToggleFavorite?.(shop)} 
                          activeOpacity={0.8}
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/80"
                        >
                          <Heart size={15} color={isFav ? "#ef4444" : "#161719"} fill={isFav ? "#ef4444" : "transparent"} />
                        </TouchableOpacity>
                      </View>

                      {/* Right: Card Details */}
                      <View className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
                        <View>
                          <View className="flex-row items-center justify-between gap-2 mb-1">
                            <Text className="truncate font-display text-base font-bold text-slate-900 flex-1">
                              {shop.name}
                            </Text>
                            <View className="flex-row shrink-0 items-center gap-1 rounded-lg border border-amber-200/60 bg-amber-50 px-2 py-0.5">
                              <Star size={12} color="#fbbf24" fill="#fbbf24" />
                              <Text className="font-display text-xs font-bold text-slate-900">
                                {parseFloat(shop.rating || "0").toFixed(1)}
                              </Text>
                            </View>
                          </View>

                          <View className="flex-row items-center gap-1.5 mb-2">
                            <MapPin size={14} color="#94a3b8" />
                            <Text className="truncate font-medium text-xs text-slate-500">{shop.address || shop.city}</Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between border-t border-slate-100 pt-2.5 mt-auto">
                          <Text className="font-display text-[11px] font-bold uppercase tracking-wider text-[#3473ef]">
                            {shop.total_reviews || 0} vlerësime
                          </Text>
                          <TouchableOpacity 
                            onPress={() => onSelectShop(shop)}
                            activeOpacity={0.8}
                            className="flex-row items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-1.5"
                          >
                            <Text className="font-display text-xs font-bold text-white">Rezervo</Text>
                            <ArrowUpRight size={13} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* Right Side: Full Size Interactive Leaflet / Google Map */}
          <View className="flex-1 bg-slate-900 relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs h-full">
            <LeafletMapView 
              shops={filteredShops} 
              onSelectShop={onSelectShop} 
              initialCity={initialCity} 
              mapType={mapType} 
              initialCoords={initialCoords} 
              width={width} 
              height={height} 
            />
          </View>
        </View>

        {/* BUSINESS REGISTRATION BANNER BELOW MAP & CARDS */}
        <View className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 pb-12 pt-8">
          <View className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-10 shadow-xl sm:px-12 lg:flex-row lg:items-center lg:justify-between">
            {/* Decorative background glow */}
            <View className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#3473ef]/30 blur-3xl pointer-events-none" />
            <View className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <View className="relative z-10 max-w-2xl">
              <View className="flex-row items-center gap-2 rounded-full bg-[#3473ef]/20 px-3.5 py-1 text-xs font-bold text-[#3473ef] border border-[#3473ef]/30 mb-3 self-start">
                <Sparkles size={14} color="#3473ef" />
                <Text className="text-xs font-bold text-[#3473ef]">Për Pronarët e Salloneve & Berberive</Text>
              </View>
              <Text className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Regjistro sallonin tënd në LineUp dhe rrite biznesin
              </Text>
              <Text className="mt-2 text-sm text-slate-300 font-medium">
                Merri rezervimet online 24/7, menaxho berberët dhe ekipin tuaj, dhe dallo kohën me sistemin më të avancuar në Kosovë.
              </Text>
            </View>

            <View className="relative z-10 mt-6 flex-row shrink-0 items-center gap-4 lg:mt-0">
              <TouchableOpacity
                onPress={() => onOpenRegisterShop && onOpenRegisterShop()}
                activeOpacity={0.8}
                className="flex-row items-center gap-2 rounded-2xl bg-[#3473ef] px-6 py-3.5"
              >
                <Store size={16} color="white" />
                <Text className="font-display text-sm font-bold text-white">Regjistro Biznesin Tënd</Text>
                <ArrowUpRight size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* WEB FOOTER */}
        <View className="w-full">
          <WebFooter onNavigateTab={onNavigateTab} onOpenRegisterShop={onOpenRegisterShop} />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <View style={{ width, height, position: 'absolute' }}>
        <LeafletMapView shops={filteredShops} onSelectShop={onSelectShop} initialCity={initialCity} mapType={mapType} initialCoords={initialCoords} width={width} height={height} />
      </View>

      <View className="absolute top-14 left-6 right-6 z-50">
        <TouchableOpacity activeOpacity={0.9} onPress={onOpenSearch} className="overflow-hidden border border-white/90 shadow-2xl bg-white/60" style={{ borderRadius: 100 }}>
          <BlurView intensity={80} tint="light" className="flex-row items-center pl-5 pr-1.5 py-1.5">
            <Search size={22} color="#161719" strokeWidth={3} />
            <View className="flex-1 ml-3 h-12 justify-center"><Text className="text-[16px] text-[#4b5563] font-extrabold">Kërko sallone, trajtime...</Text></View>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); runOnJS(toggleSheet)(!isExpanded); }} className="w-12 h-12 rounded-full bg-black items-center justify-center ml-2 shadow-lg">
              {isExpanded ? <MapIcon size={20} color="white" /> : <List size={20} color="white" />}
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </View>

      <View className="absolute top-[135px] right-6 z-50">
        <TouchableOpacity activeOpacity={0.9} onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')} className="w-12 h-12 rounded-full items-center justify-center bg-white/60 border border-white/90 shadow-xl">
          <BlurView intensity={80} tint="light" className="w-full h-full items-center justify-center rounded-full overflow-hidden"><Layers size={22} color="#161719" /></BlurView>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[rBottomSheetStyle]} className="absolute top-0 left-0 right-0 bg-white rounded-t-[40px] shadow-2xl border-t border-slate-100 h-full z-40">
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mt-3 mb-2" />
          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 180 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
            <Text className="text-[#8789A3] text-center font-bold text-sm mb-6">{filteredShops.length} vende në zonën e hartës</Text>
            {loading ? <ActivityIndicator size="large" color="#6366f1" className="mt-10" /> : filteredShops.length === 0 ? (
              <View className="items-center justify-center py-20 px-6"><View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4"><Search size={32} color="#8789A3" /></View><Text className="text-xl font-black text-[#161719] mb-2 text-center">Nuk u gjet asnjë sallon</Text></View>
            ) : filteredShops.map((shop, i) => (
              <View key={shop.id || i} className="mb-10 bg-white rounded-[40px] p-2 shadow-2xl shadow-black/20 border border-slate-50" style={{ elevation: 15 }}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectShop(shop)} className="rounded-[34px] overflow-hidden bg-slate-50 mb-4">
                  <Image source={{ uri: getShopCardImage(shop) }} className="w-full h-60 object-cover" />
                  {(() => {
                    const isFav = favorites?.some(f => f.shop_id === shop.id || f.shop_id === Number(shop.id));
                    return (
                      <TouchableOpacity onPress={() => onToggleFavorite?.(shop)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md items-center justify-center border border-white/30"><Heart size={20} color={isFav ? "#ef4444" : "white"} fill={isFav ? "#ef4444" : "transparent"} /></TouchableOpacity>
                    );
                  })()}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectShop(shop)} className="px-5 pb-5">
                  <View className="flex-row justify-between items-center mb-3"><Text className="text-xl font-black text-[#161719] flex-1 mr-4" numberOfLines={1}>{shop.name}</Text><View className="flex-row items-center bg-amber-50 px-2.5 py-1 rounded-xl"><Star size={14} color="#fbbf24" fill="#fbbf24" /><Text className="text-[#161719] font-black text-sm ml-1.5">{parseFloat(shop.rating || "0").toFixed(1)}</Text></View></View>
                  <View className="flex-row items-center mb-3"><MapPin size={14} color="#8789A3" /><Text className="text-[#8789A3] text-sm font-bold ml-1.5 flex-1" numberOfLines={1}>{shop.address || shop.city}</Text></View>
                  <Text className="text-[#3473ef] text-xs font-black uppercase tracking-widest">{shop.total_reviews || 0} vlerësime</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View className="h-40" />
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
