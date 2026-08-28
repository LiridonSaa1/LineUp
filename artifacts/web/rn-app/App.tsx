import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity, Text, Dimensions, Platform, Modal, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Home, Search, Calendar, User, Shield, MapPin, ChevronDown } from "lucide-react-native";
import { Image as RNImage } from "react-native";
import { useWindowDimensions } from "react-native";

const logoImg = require('./assets/logo.png');
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

const DesktopHeaderBar = ({
  activeTab,
  onTabPress,
  tabs,
  user,
  selectedLocation,
  onOpenLocation,
  onOpenSearch,
  onOpenRegisterShop
}: any) => {
  return (
    <View className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <View className="mx-auto flex max-w-[1440px] flex-row items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <TouchableOpacity
          onPress={() => onTabPress(0)}
          activeOpacity={0.8}
          className="flex-row shrink-0 items-center gap-2 mr-6 lg:mr-12"
        >
          <RNImage source={logoImg} style={{ width: 40, height: 40, maxWidth: 40, maxHeight: 40 }} className="rounded-xl" resizeMode="contain" />
        </TouchableOpacity>

        <View className="hidden flex-row items-center gap-2 lg:flex ml-4 lg:ml-8">
          {["Ballina", "Kërko", "Aktiviteti", "Profili"].map((item, i) => (
            <TouchableOpacity
              key={item}
              onPress={() => onTabPress(i)}
              activeOpacity={0.8}
              className={`rounded-full px-4 py-2 transition-colors ${
                activeTab === i
                  ? "bg-slate-100"
                  : "hover:bg-slate-50"
              }`}
            >
              <Text className={`text-sm ${activeTab === i ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="ml-auto flex flex-row items-center gap-3">
          <TouchableOpacity
            onPress={onOpenLocation}
            activeOpacity={0.8}
            className="flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2"
          >
            <MapPin size={16} color="#3473ef" />
            <Text className="text-sm font-medium text-slate-900">{selectedLocation}</Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (user) {
                onTabPress(3);
              } else {
                onOpenRegisterShop();
              }
            }}
            activeOpacity={0.8}
            className="shrink-0 rounded-full bg-slate-900 px-5 py-2.5"
          >
            <Text className="text-white font-semibold text-sm">
              {user ? (user.name || "Profili") : "Kyçu"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
import { HomeScreen } from "./src/screens/HomeScreen";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { BarberDetailScreen } from "./src/screens/BarberDetailScreen";
import { LocationScreen } from "./src/screens/LocationScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { BarberDashboardScreen } from "./src/screens/BarberDashboardScreen";
import { AdminDashboardScreen } from "./src/screens/AdminDashboardScreen";
import { AddAdModal } from "./src/screens/AddAdModal";
import { MobileAppBanner } from "./src/components/MobileAppBanner";
import { MobileAppDownloadCard } from "./src/components/MobileAppDownloadCard";
import { supabase } from "./src/config/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES, CATEGORY_ORDER } from "./src/config/defaultCategories";
import "./global.css";

const { width } = Dimensions.get("window");
const TAB_BAR_WIDTH = width - 48; // Padding on both sides
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

const TabButton = ({ tab, isActive, onPress }: any) => {
  const Icon = tab.icon;

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isActive ? 1.05 : 1) }],
    };
  });

  if (tab.label === 'Profile') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="items-center justify-center h-full"
        style={{ width: TAB_WIDTH }}
      >
        <View className="items-center justify-center">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center mb-0.5 border-2 ${
              isActive ? 'border-[#3473ef] bg-white' : 'border-transparent bg-[#f47458]'
            }`}
          >
            <Text className={`${isActive ? 'text-[#3473ef]' : 'text-white'} text-sm font-bold`}>L</Text>
          </View>
          <Text className={`text-[11px] font-bold ${isActive ? 'text-[#3473ef]' : 'text-[#161719]'}`}>
            Profile
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="items-center justify-center h-full"
      style={{ width: TAB_WIDTH }}
    >
      <View className="items-center justify-center">
        <Animated.View style={animatedIconStyle}>
          <Icon
            size={24}
            color={isActive ? "#3473ef" : "#161719"}
            strokeWidth={isActive ? 2.5 : 1.8}
            fill="none"
          />
        </Animated.View>

        <Text
          className={`text-[11px] mt-1 font-bold ${isActive ? 'text-[#3473ef]' : 'text-[#161719]'}`}
        >
          {tab.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

  const [activeTab, setActiveTab] = React.useState(0);
  const [adminUser, setAdminUser] = React.useState<any>(null);
  // ... rest of state
  const [selectedShop, setSelectedShop] = React.useState<any>(null);
  const [user, setUser] = React.useState<any>(null);
  const [cityFilter, setCityFilter] = React.useState("Të gjitha");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchCategoryName, setSearchCategoryName] = React.useState("");
  const [searchSubIds, setSearchSubIds] = React.useState<string[]>([]);
  const [searchDate, setSearchDate] = React.useState("Anytime");
  const [searchTime, setSearchTime] = React.useState("Anytime");
  const [searchCoords, setSearchCoords] = React.useState<{ lat?: number; lng?: number }>({});
  const [showLocation, setShowLocation] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showRegisterShop, setShowRegisterShop] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [showAddAd, setShowAddAd] = React.useState(false);
  const [showAuthAlert, setShowAuthAlert] = React.useState(false);
  const [categories, setCategories] = React.useState<any[]>(DEFAULT_CATEGORIES);
  const [subcategories, setSubcategories] = React.useState<any[]>(DEFAULT_SUBCATEGORIES);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = React.useState("Lokacioni aktual");

  const tabPosition = useSharedValue(0);
  const [favorites, setFavorites] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadFavorites() {
      if (!user?.id) {
        setFavorites([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('*, barbershops(*)')
          .eq('user_id', user.id);
        if (data) setFavorites(data);
      } catch (err) {
        console.warn("Failed to load favorites in App.tsx:", err);
      }
    }
    loadFavorites();
  }, [user]);

  const handleToggleFavorite = async (shop: any) => {
    if (!user) {
      setShowAuthAlert(true);
      return;
    }
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}

    const shopId = typeof shop === 'object' ? shop.id : shop;
    const isFav = favorites.some(f => String(f.shop_id) === String(shopId) || String(f.id) === String(shopId));
    if (isFav) {
      const updated = favorites.filter(f => String(f.shop_id) !== String(shopId) && String(f.id) !== String(shopId));
      setFavorites(updated);
      try {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('shop_id', shopId);
      } catch (err) {
        console.warn("Failed to remove favorite in database:", err);
      }
    } else {
      const newFav = { user_id: user.id, shop_id: shopId };
      setFavorites([...favorites, newFav]);
      try {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            shop_id: shopId
          });
      } catch (err) {
        console.warn("Failed to insert favorite in database:", err);
      }
    }
  };

  React.useEffect(() => {
    async function loadStaticData() {
      try {
        // Try to load cached data first for instant loads
        const cachedCats = await AsyncStorage.getItem('cached_categories');
        const cachedSubs = await AsyncStorage.getItem('cached_subcategories');
        
        if (cachedCats) setCategories(JSON.parse(cachedCats));
        if (cachedSubs) setSubcategories(JSON.parse(cachedSubs));

        const [{ data: dbCats }, { data: dbSubs }] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('subcategories').select('*').order('name')
        ]);
        
        if (dbCats && dbCats.length > 0) {
          const sortedCats = [...dbCats].sort((a, b) => {
            const indexA = CATEGORY_ORDER.indexOf(a.name);
            const indexB = CATEGORY_ORDER.indexOf(b.name);
            if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });

          if (dbSubs && dbSubs.length > 0) {
            setCategories(sortedCats);
            setSubcategories(dbSubs);
            await AsyncStorage.setItem('cached_categories', JSON.stringify(sortedCats));
            await AsyncStorage.setItem('cached_subcategories', JSON.stringify(dbSubs));
          } else {
            setCategories(sortedCats);
            await AsyncStorage.setItem('cached_categories', JSON.stringify(sortedCats));
          }
        }
      } catch (err) {
        console.warn("Failed to load static categories/subcategories:", err);
      }
    }
    loadStaticData();
  }, []);

  const fetchUserProfile = React.useCallback(async (email: string, sessionUser: any) => {
    try {
      const cleanEmail = email.toLowerCase();
      const [dbUser, dbBarberShop, barberProfile] = await Promise.all([
        supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle(),
        supabase.from('barbershops').select('*').eq('owner_id', sessionUser.id).maybeSingle(),
        supabase.from('barbers').select('*').eq('user_id', sessionUser.id).maybeSingle()
      ]);

      const userId = sessionUser.id;
      const isOwner = !!dbBarberShop.data || dbUser.data?.role === 'owner';
      const isBarber = !isOwner && (dbUser.data?.role === 'barber' || dbUser.data?.role === 'employee' || (!!barberProfile.data && !isOwner));

      console.log("[App.tsx] Checking profile for:", cleanEmail, { isRegistering, isOwner, isBarber, hasDbUser: !!dbUser.data });

      const parentShop = dbBarberShop.data;
      const shopId = parentShop?.id || barberProfile.data?.shop_id;

      // Fetch latest subscription - check user_id, customer_id, and shopId
      let queryFilter = `user_id.eq.${userId},customer_id.eq.${userId},business_id.eq.${userId}`;
      if (shopId) queryFilter += `,business_id.eq.${shopId}`;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .or(queryFilter)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const now = new Date();
      const expiryDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
      const isExpired = expiryDate ? expiryDate < now : false;

      const subActive = (parentShop?.status === 'active') || (subscription
        ? (['active', 'trialing', 'past_due', 'paused'].includes(subscription.status) ||
           (subscription.cancel_at_period_end && !isExpired) ||
           (subscription.status === 'canceled' && !isExpired))
        : false);

      // --- LOCKOUT LOGIC ---

      // 1. Admin Suspension (Manual)
      if (parentShop?.status === 'suspended') {
        Alert.alert("Llogari e Bllokuar", "Salloni juaj është pezulluar nga administratori.");
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      // 2. Subscription Expiry for non-owner barbers
      if (parentShop && !subActive && isBarber && !isOwner) {
        Alert.alert("Abonimi ka Skaduar", "Salloni ku punoni nuk ka abonim aktiv.");
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      const isAdmin = dbUser.data?.role === 'super_admin' || dbUser.data?.role === 'admin' || sessionUser.user_metadata?.role === 'super_admin' || sessionUser.user_metadata?.role === 'admin';
      const determinedRole = isAdmin ? (dbUser.data?.role || 'super_admin') : (isOwner ? 'owner' : (dbUser.data?.role || (isBarber ? 'barber' : (sessionUser.user_metadata?.role || 'client'))));

      setUser({
        id: sessionUser.id,
        name: dbBarberShop.data?.name || dbUser.data?.name || dbUser.data?.full_name || sessionUser.user_metadata?.full_name || email.split('@')[0],
        email: dbUser.data?.email || cleanEmail,
        role: determinedRole,
        shopId: shopId || null,
        needsPayment: isOwner && !subActive && !isAdmin
      });
    } catch (err) {
      console.warn("Error fetching profile:", err);
    }
  }, [isRegistering]);

  const [authLoading, setAuthLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;

    // Check active session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        fetchUserProfile(session.user.email, session.user).finally(() => {
          if (isMounted) setAuthLoading(false);
        });
      } else {
        if (isMounted) setAuthLoading(false);
      }
    }).catch(() => {
      if (isMounted) setAuthLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        fetchUserProfile(session.user.email, session.user).finally(() => {
          if (isMounted) setAuthLoading(false);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (isMounted) setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const handleImpersonate = (targetUser: any) => {
    setAdminUser(user);
    setUser(targetUser);
    setActiveTab(0); // Go to home to see the app as that user
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Impersonim", `Tashmë jeni duke lundruar si ${targetUser.name || targetUser.email}`);
  };

  const handleStopImpersonating = () => {
    setUser(adminUser);
    setAdminUser(null);
    setActiveTab(2); // Go back to dashboard
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  React.useEffect(() => {
    tabPosition.value = withSpring(activeTab * TAB_WIDTH, { damping: 15, stiffness: 120 });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleCitySelect = (city: string) => {
    setCityFilter(city);
    setActiveTab(1); // Switch to Explore/Search tab
  };

  const handleSearch = (filters: { query: string; city: string; lat?: number; lng?: number; subIds?: string[]; categoryName?: string; date?: string; time?: string; shouldClose?: boolean }) => {
    console.log("[App.tsx] handleSearch called with filters:", filters);
    if (filters.subIds) setSearchSubIds(filters.subIds);
    setSearchQuery(filters.query);
    setSearchCategoryName(filters.categoryName || "");
    setSearchDate(filters.date || "Anytime");
    setSearchTime(filters.time || "Anytime");
    setCityFilter(filters.city);
    setSearchCoords({ lat: filters.lat, lng: filters.lng });
    setSelectedLocation(filters.city);

    if (filters.shouldClose !== false) {
      setShowSearch(false);
      setActiveTab(1); // Switch to Explore tab
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const isBusinessRole = user?.role === 'barber' || user?.role === 'owner' || user?.role === 'employee';
  const isAdminRole = user?.role === 'super_admin' || user?.role === 'admin';

  const tabs = [
    { label: 'Ballina', icon: Home },
    { label: 'Kërko', icon: Search },
    { label: (isAdminRole || isBusinessRole) ? 'Paneli' : 'Aktiviteti', icon: Calendar },
    { label: 'Profili', icon: User },
  ];

  const onTabPress = (index: number) => {
    setActiveTab(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Animated style for the floating background pill
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPosition.value }],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View className="flex-1 bg-[#f8fafc]">
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
          <StatusBar style="dark" />

          {/* Smart Mobile Browser App Download Banner */}
          <MobileAppBanner />

          {/* Desktop Web Navigation Bar (Non-Home tabs or mobile) */}
          {isDesktop && activeTab !== 0 && (
            <DesktopHeaderBar
              activeTab={activeTab}
              onTabPress={onTabPress}
              tabs={tabs}
              user={user}
              selectedLocation={selectedLocation}
              onOpenLocation={() => setShowLocation(true)}
              onOpenSearch={() => setShowSearch(true)}
              onOpenRegisterShop={() => setShowRegisterShop(true)}
            />
          )}

          {/* Conditional Rendering: Standard App Structure for all roles */}
          <>
            {selectedShop ? (
              <BarberDetailScreen
                shop={selectedShop}
                user={user}
                onLogin={(userData) => setUser(userData)}
                onBack={() => setSelectedShop(null)}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              <View className={`flex-1 ${isDesktop ? 'w-full' : ''}`}>
                {activeTab === 0 && (
                  <HomeScreen
                    onSelectShop={(shop) => setSelectedShop(shop)}
                    onOpenLocation={() => setShowLocation(true)}
                    onOpenSearch={() => setShowSearch(true)}
                    onOpenAddAd={() => setShowAddAd(true)}
                    selectedLocation={selectedLocation}
                    onSearch={(query, subIds, categoryName) => handleSearch({ query, city: selectedLocation, subIds, categoryName })}
                    onStartPlan={(planId) => {
                      setSelectedPlanId(planId);
                      setShowRegisterShop(true);
                    }}
                    onManagePlan={() => setActiveTab(3)} // Profile for management
                    onUpgradePlan={(planId) => {
                      setActiveTab(3);
                    }}
                    onDowngradePlan={(planId) => {
                      setActiveTab(3);
                    }}
                    onRenewPlan={(planId) => {
                      setActiveTab(3);
                    }}
                    categories={categories}
                    subcategories={subcategories}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    user={user}
                    onTabPress={(index) => setActiveTab(index)}
                    activeTab={activeTab}
                  />
                )}
                {activeTab === 1 && (
                  <ExploreScreen
                    initialSubIds={searchSubIds}
                    onSelectShop={(shop) => setSelectedShop(shop)}
                    onOpenSearch={() => setShowSearch(true)}
                    initialCity={cityFilter}
                    initialSearch={searchQuery}
                    initialCoords={searchCoords}
                    initialCategoryName={searchCategoryName}
                    initialDate={searchDate}
                    initialTime={searchTime}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenRegisterShop={() => setShowRegisterShop(true)}
                    onNavigateTab={(idx) => setActiveTab(idx)}
                  />
                )}
                {activeTab === 2 && (
                  <ActivityScreen
                    user={user}
                    onLogin={() => setActiveTab(3)}
                    onNavigateToSearch={() => setActiveTab(1)}
                    onLogout={async () => {
                      await supabase.auth.signOut();
                      setUser(null);
                    }}
                    onImpersonate={handleImpersonate}
                  />
                )}
                {activeTab === 3 && (
                  <ProfileScreen
                    user={user}
                    onLogin={(userData) => setUser(userData)}
                    onLogout={async () => {
                      await supabase.auth.signOut();
                      setUser(null);
                    }}
                    onOpenRegisterShop={() => setShowRegisterShop(true)}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectShop={(shop) => {
                      setSelectedShop(shop);
                    }}
                  />
                )}
              </View>
            )}

              {/* Location Selection Modal (Bottom Sheet Style) */}
              <Modal
                visible={showLocation}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowLocation(false)}
              >
                <View className={`flex-1 justify-end ${isDesktop ? 'items-center pb-4 sm:pb-8' : ''}`}>
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/45 z-0"
                    activeOpacity={1}
                    onPress={() => setShowLocation(false)}
                  />
                  <View className={`bg-white overflow-hidden shadow-2xl z-10 ${
                    isDesktop 
                      ? 'w-full max-w-2xl lg:max-w-3xl rounded-[36px] h-[85vh] border border-slate-200/80' 
                      : 'w-full rounded-t-[40px] h-[88vh]'
                  }`}>
                    <LocationScreen
                      onBack={() => setShowLocation(false)}
                      onSelectLocation={(loc) => {
                        setSelectedLocation(loc);
                        setCityFilter(loc);
                        setShowLocation(false);
                      }}
                    />
                  </View>
                </View>
              </Modal>

              {/* Search Modal */}
              <Modal
                visible={showSearch}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSearch(false)}
              >
                <View className={`flex-1 justify-end ${isDesktop ? 'items-center pb-4 sm:pb-8' : ''}`}>
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/45 z-0"
                    activeOpacity={1}
                    onPress={() => setShowSearch(false)}
                  />
                  <View className={`bg-white overflow-hidden shadow-2xl z-10 ${
                    isDesktop 
                      ? 'w-full max-w-2xl lg:max-w-3xl rounded-[36px] h-[85vh] border border-slate-200/80' 
                      : 'w-full rounded-t-[40px] h-[88vh]'
                  }`}>
                    <SearchScreen
                      onClose={() => setShowSearch(false)}
                      onSearch={handleSearch}
                      currentLocation={selectedLocation}
                      categories={categories}
                      subcategories={subcategories}
                      initialQuery={searchQuery}
                      initialDate={searchDate}
                      initialTime={searchTime}
                      initialSubIds={searchSubIds}
                      initialCategoryName={searchCategoryName}
                    />
                  </View>
                </View>
              </Modal>

              {/* Register Shop Modal */}
              <Modal
                visible={showRegisterShop}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                  setShowRegisterShop(false);
                  setSelectedPlanId(undefined);
                }}
              >
                <View className={`flex-1 justify-end ${isDesktop ? 'items-center pb-4 sm:pb-8' : ''}`}>
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/45 z-0"
                    activeOpacity={1}
                    onPress={() => {
                      setShowRegisterShop(false);
                      setSelectedPlanId(undefined);
                    }}
                  />
                  <View className={`bg-white overflow-hidden shadow-2xl z-10 ${
                    isDesktop 
                      ? 'w-full max-w-2xl lg:max-w-3xl rounded-[36px] h-[88vh] border border-slate-200/80' 
                      : 'w-full rounded-t-[40px] h-[92vh]'
                  }`}>
                    <RegisterScreen
                      initialPlanId={selectedPlanId}
                      setIsRegistering={setIsRegistering}
                      onClose={() => {
                        setShowRegisterShop(false);
                        setSelectedPlanId(undefined);
                      }}
                      onSuccess={() => {
                        setShowRegisterShop(false);
                        setSelectedPlanId(undefined);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                    />
                  </View>
                </View>
              </Modal>

              {/* Add Ad Modal */}
              <Modal
                visible={showAddAd}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddAd(false)}
              >
                <View className={`flex-1 justify-end ${isDesktop ? 'items-center pb-4 sm:pb-8' : ''}`}>
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/45"
                    activeOpacity={1}
                    onPress={() => setShowAddAd(false)}
                  />
                  <View className={`bg-white overflow-hidden shadow-2xl ${
                    isDesktop 
                      ? 'w-full max-w-2xl lg:max-w-3xl rounded-[36px] h-auto max-h-[85vh] border border-slate-200/80' 
                      : 'w-full rounded-t-[40px] h-auto max-h-[88vh]'
                  }`}>
                    <AddAdModal
                      onClose={() => setShowAddAd(false)}
                      onSuccess={() => {
                        setShowAddAd(false);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                    />
                  </View>
                </View>
              </Modal>

              {/* ── MODERN ANIMATED BOTTOM BAR (MOBILE ONLY) ────────────────────── */}
              {!selectedShop && !isDesktop && (
                <View className="absolute bottom-10 left-6 right-6" style={{ zIndex: 100 }}>
                  <View
                    className="h-[64px] rounded-[32px] overflow-hidden shadow-2xl shadow-black/10 border border-white/60"
                    style={{ width: TAB_BAR_WIDTH }}
                  >
                    <BlurView
                      intensity={20}
                      tint="light"
                      className="flex-1 flex-row items-center px-0 bg-white/10"
                    >
                      <Animated.View
                        style={[
                          indicatorStyle,
                          {
                            position: 'absolute',
                            width: TAB_WIDTH - 16,
                            height: 48,
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: 24,
                            left: 8,
                            top: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                          }
                        ]}
                      />

                      {tabs.map((tab, i) => (
                        <TabButton
                          key={i}
                          tab={tab}
                          isActive={activeTab === i}
                          onPress={() => onTabPress(i)}
                        />
                      ))}
                    </BlurView>
                  </View>
                </View>
              )}

              {/* Sleek Custom Auth Required Modal */}
              {showAuthAlert && (
                <Modal
                  transparent
                  visible={showAuthAlert}
                  animationType="fade"
                  onRequestClose={() => setShowAuthAlert(false)}
                >
                  <View className="flex-1 items-center justify-center bg-slate-900/60 p-4 z-50">
                    <View className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 items-center text-center">
                      <View className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100/60 shadow-2xs">
                        <User size={32} color="#3473ef" />
                      </View>

                      <Text className="text-xl font-bold text-slate-900 mb-2 text-center">
                        Llogaria Kërkohet
                      </Text>

                      <Text className="text-sm font-medium text-slate-500 leading-relaxed mb-6 text-center">
                        Ju lutem kyçuni ose krijoni një llogari për të ruajtur sallonin tuaj të preferuar te lista e të ruajturave.
                      </Text>

                      <View className="flex w-full flex-col gap-2.5">
                        <TouchableOpacity
                          onPress={() => {
                            setShowAuthAlert(false);
                            setShowRegisterShop(true);
                          }}
                          className="flex-row w-full items-center justify-center gap-2 rounded-2xl bg-[#3473ef] py-3.5 px-4 shadow-md"
                        >
                          <User size={18} color="white" />
                          <Text className="text-sm font-bold text-white">Kyçu ose Regjistrohu</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setShowAuthAlert(false)}
                          className="w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 px-4"
                        >
                          <Text className="text-sm font-semibold text-slate-600">Më vonë</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

              {/* Floating Return to Admin Button */}
              {adminUser && (
                <TouchableOpacity
                  onPress={handleStopImpersonating}
                  activeOpacity={0.9}
                  className="absolute bottom-[110px] right-6 bg-[#161719] px-6 h-12 rounded-full flex-row items-center justify-center shadow-2xl border border-white/10"
                  style={{ zIndex: 1000 }}
                >
                  <Animated.View entering={FadeIn} className="flex-row items-center">
                    <Shield size={18} color="white" />
                    <Text className="text-white font-black ml-3 text-xs">Dil nga Impersonimi</Text>
                  </Animated.View>
                </TouchableOpacity>
              )}
            </>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
