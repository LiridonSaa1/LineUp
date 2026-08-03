import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform, RefreshControl } from "react-native";
import { Search, MapPin, List, Map as MapIcon, Star, Heart, ArrowUpRight, ChevronDown, Check, SlidersHorizontal, Layers } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS
} from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { supabase } from "@/config/supabase";
import { getShopCardImage } from "../utils/imageUtils";
import * as Haptics from 'expo-haptics';

let RNWebView: any = null;
if (Platform.OS !== 'web') {
  try {
    RNWebView = require('react-native-webview').WebView;
  } catch (e) {
    // Suppress warning
  }
}

const { width, height } = Dimensions.get("window");
const SHEET_MIN_HEIGHT = height * 0.35;
const SHEET_MAX_HEIGHT = height - 160;

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

interface ExploreScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenSearch: () => void;
  initialCity?: string;
  initialSearch?: string;
  initialCoords?: { lat?: number; lng?: number };
  initialSubIds?: string[];
  initialCategoryName?: string;
  favorites?: any[];
  onToggleFavorite?: (shop: any) => void;
}

const INITIAL_REGION = { lat: 42.5500, lng: 20.8500, zoom: 9 };

const LeafletMapView = ({ shops, onSelectShop, initialCity, mapType, initialCoords }: { shops: any[], onSelectShop: (shop: any) => void, initialCity?: string, mapType: 'standard' | 'satellite', initialCoords?: { lat?: number; lng?: number } }) => {
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
  onSelectShop, onOpenSearch, initialCity = "Të gjitha", initialSearch = "", initialCoords, initialSubIds = [], initialCategoryName = "", favorites = [], onToggleFavorite
}) => {
  const [shops, setShops] = useState<any[]>([]);
  const [filteredShops, setFilteredShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    let result = [...shops];
    const cleanCity = normalizeCity(initialCity);
    if (cleanCity && cleanCity !== normalizeCity("të gjitha") && cleanCity !== normalizeCity("lokacioni aktual")) {
      result = result.filter(shop => {
        const detected = normalizeCity(getShopCityName(shop));
        const addrMatch = normalizeCity(shop.address || shop.formatted_address || "").includes(cleanCity);
        return detected === cleanCity || addrMatch;
      });
    }
    const activeSubIds = (initialSubIds || []).filter(id => id && id.toString().trim().length > 0).map(id => String(id).trim().toLowerCase());
    const hasCategoryFilter = activeSubIds.length > 0 || (initialCategoryName && initialCategoryName.trim().length > 0);
    if (hasCategoryFilter) {
      result = result.filter(shop => {
        const shopSubcategories = (shop.subcategories || []).map((id: string) => String(id).trim().toLowerCase());
        const matchesSubId = activeSubIds.length > 0 && shopSubcategories.some((id: string) => activeSubIds.includes(id));
        const matchesCategory = initialCategoryName && shop.category?.toLowerCase().trim() === initialCategoryName.toLowerCase().trim();
        return matchesSubId || matchesCategory;
      });
    }
    if (initialSearch && initialSearch.trim().length > 0) {
      const cleanSearch = initialSearch.toLowerCase().trim();
      result = result.filter(shop => {
        const nameMatch = shop.name?.toLowerCase().includes(cleanSearch);
        const cityMatch = shop.city?.toLowerCase().includes(cleanSearch);
        const addressMatch = shop.address?.toLowerCase().includes(cleanSearch);
        return nameMatch || cityMatch || addressMatch;
      });
    }
    setFilteredShops(result);
  }, [shops, initialCity, initialSearch, initialSubIds]);

  const translateY = useSharedValue(height - SHEET_MIN_HEIGHT);
  const context = useSharedValue(0);

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
      const [{ data: shopsData }, { data: barbersData }] = await Promise.all([supabase.from('barbershops').select('*'), supabase.from('barbers').select('*')]);
      const combined = [...(shopsData || [])];
      if (barbersData) barbersData.forEach((b: any) => { if (!combined.some(s => s.id === b.shop_id || s.id === b.id)) combined.push(b); });
      setShops(combined);
    } catch (e) { console.warn(e); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadShops(); }, [loadShops]);
  const onRefresh = () => { loadShops(true); try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {} };

  return (
    <GestureHandlerRootView className="flex-1">
      <View style={{ width, height, position: 'absolute' }}>
        <LeafletMapView shops={filteredShops} onSelectShop={onSelectShop} initialCity={initialCity} mapType={mapType} initialCoords={initialCoords} />
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
