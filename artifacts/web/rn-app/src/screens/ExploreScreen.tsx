import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform } from "react-native";
import { Search, MapPin, List, Map as MapIcon, Star, Heart, ArrowUpRight, ChevronDown, Check, SlidersHorizontal } from "lucide-react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  FadeIn,
  interpolate,
  Extrapolate,
  useDerivedValue,
  runOnJS
} from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { supabase } from "@/config/supabase";

const { width, height } = Dimensions.get("window");
const SHEET_MIN_HEIGHT = height * 0.35; // Lower position
const SHEET_MAX_HEIGHT = height - 160; // Leave room for search bar

interface ExploreScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenSearch: () => void;
  initialCity?: string;
  initialSearch?: string;
  initialCoords?: { lat?: number; lng?: number };
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onSelectShop,
  onOpenSearch,
  initialCity = "Të gjitha",
  initialSearch = "",
  initialCoords
}) => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const mapRef = useRef<MapView>(null);

  const translateY = useSharedValue(height - SHEET_MIN_HEIGHT);
  const context = useSharedValue(0);

  const toggleSheet = (expand?: boolean) => {
    const shouldExpand = expand !== undefined ? expand : translateY.value > (height - SHEET_MAX_HEIGHT + 100);
    if (shouldExpand) {
      translateY.value = withTiming(height - SHEET_MAX_HEIGHT, { duration: 150 });
      setIsExpanded(true);
    } else {
      translateY.value = withTiming(height - SHEET_MIN_HEIGHT, { duration: 150 });
      setIsExpanded(false);
    }
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (scrollY > 5 && !isExpanded) {
      runOnJS(toggleSheet)(true);
    } else if (scrollY < -40 && isExpanded) {
      runOnJS(toggleSheet)(false);
    }
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value;
      translateY.value = Math.max(translateY.value, height - SHEET_MAX_HEIGHT);
      translateY.value = Math.min(translateY.value, height - SHEET_MIN_HEIGHT);
    })
    .onEnd(() => {
      const midPoint = ( (height - SHEET_MIN_HEIGHT) + (height - SHEET_MAX_HEIGHT) ) / 2;
      if (translateY.value < midPoint) {
        translateY.value = withTiming(height - SHEET_MAX_HEIGHT, { duration: 150 });
        runOnJS(setIsExpanded)(true);
      } else {
        translateY.value = withTiming(height - SHEET_MIN_HEIGHT, { duration: 150 });
        runOnJS(setIsExpanded)(false);
      }
    });

  useDerivedValue(() => {
    if (translateY.value < height - SHEET_MAX_HEIGHT + 50) {
      // setIsExpanded(true); // runOnJS
    }
  });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const rHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [height - SHEET_MAX_HEIGHT, height - SHEET_MAX_HEIGHT + 50],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  useEffect(() => {
    if (initialCoords?.lat && initialCoords?.lng) {
      mapRef.current?.animateToRegion({
        latitude: initialCoords.lat,
        longitude: initialCoords.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [initialCoords]);

  useEffect(() => {
    async function loadShops() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;
        setShops(data || []);
      } catch (e) {
        console.warn("Error fetching shops from Supabase:", e);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  const INITIAL_REGION = {
    latitude: 42.6629,
    longitude: 21.1655,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <GestureHandlerRootView className="flex-1">
      {/* ── MAP LAYER ────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ width, height }}
        initialRegion={INITIAL_REGION}
        className="flex-1"
        customMapStyle={mapStyle}
        mapType="satellite"
      >
        {shops.map((shop) => (
          <Marker
            key={shop.id}
            coordinate={{
              latitude: shop.latitude || 42.6629 + (Math.random() - 0.5) * 0.1,
              longitude: shop.longitude || 21.1655 + (Math.random() - 0.5) * 0.1,
            }}
          >
            <View className="bg-white px-3 py-1.5 rounded-full border border-[#3473ef] shadow-md">
              <Text className="text-[#161719] font-black text-[11px]">{shop.name}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── FLOATING SEARCH HEADER ────────────────────────── */}
      <View className="absolute top-14 left-6 right-6 z-50">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onOpenSearch}
          className="flex-row items-center bg-white rounded-full px-5 h-14 shadow-2xl shadow-black/30 border border-slate-100"
        >
          <Search size={22} color="#161719" strokeWidth={2.5} />
          <View className="flex-1 ml-4">
            <Text className="text-[#161719] font-black text-sm">
              {initialSearch || "Hair & styling"}
            </Text>
            <Text className="text-[#8789A3] text-[10px] font-bold">
              {initialCity === "Të gjitha" ? "Map area" : initialCity}
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); toggleSheet(!isExpanded); }}
            className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
          >
            {isExpanded ? (
              <MapIcon size={20} color="#161719" strokeWidth={2} />
            ) : (
              <List size={20} color="#161719" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM SHEET ──────────────────────────────────── */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[rBottomSheetStyle]}
          className="absolute top-0 left-0 right-0 bg-white rounded-t-[40px] shadow-2xl border-t border-slate-100 h-full z-40"
        >
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mt-3 mb-2" />

          <ScrollView
            className="flex-1 px-6 pt-4"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 180 }}
          >
            <Text className="text-[#8789A3] text-center font-bold text-sm mb-6">
              {shops.length} venues in map area
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#6366f1" className="mt-10" />
            ) : (
              shops.map((shop, i) => (
                <View key={shop.id || i} className="mb-10">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectShop(shop)}
                    className="rounded-[32px] overflow-hidden bg-slate-50 mb-4"
                  >
                    <Image
                      source={{ uri: shop.imageUrl || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80" }}
                      className="w-full h-72 object-cover"
                    />
                    <TouchableOpacity className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md items-center justify-center border border-white/30">
                      <Heart size={20} color="white" fill="transparent" />
                    </TouchableOpacity>

                    {/* Pagination dots indicator mock */}
                    <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
                      {[1,2,3].map(d => <View key={d} className={`w-1.5 h-1.5 rounded-full ${d === 1 ? 'bg-white' : 'bg-white/50'}`} />)}
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row justify-between items-start px-1">
                    <View className="flex-1 pr-4">
                      <Text className="text-xl font-black text-[#161719] mb-1">{shop.name}</Text>
                      <Text className="text-[#8789A3] text-sm font-bold mb-1" numberOfLines={1}>
                        {shop.address || "Pristina, Banesat e Arabve, Prishtina"}
                      </Text>
                      <Text className="text-[#8789A3] text-sm font-bold">Barber • 12 reviews</Text>
                    </View>
                    <View className="flex-row items-center pt-1">
                      <Star size={16} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-[#161719] font-black text-base ml-1.5">5,0</Text>
                    </View>
                  </View>

                  {/* Services Mini List (Image 2) */}
                  <View className="mt-4 gap-y-3 px-1">
                    {[
                      { name: "Qethja e femijve", price: "€4", time: "20 min" },
                      { name: "Ngjyrosja e flokve", price: "€5", time: "15 min" }
                    ].map((service, si) => (
                      <TouchableOpacity key={si} className="flex-row items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <View>
                          <Text className="text-[#161719] font-black text-[15px]">{service.name}</Text>
                          <Text className="text-[#8789A3] text-xs font-bold mt-0.5">{service.time}</Text>
                        </View>
                        <Text className="text-[#161719] font-black text-[15px]">{service.price}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity>
                      <Text className="text-[#6366f1] font-black text-sm mt-1">View 2 matching services</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View className="h-40" />
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];
