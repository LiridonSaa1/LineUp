import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity, Text, Dimensions, Platform, Modal, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Home, Search, Calendar, User, Shield } from "lucide-react-native";
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
      Alert.alert("Llogaria kërkohet", "Ju lutem kyçuni për të shtuar në të ruajtura.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isFav = favorites.some(f => f.shop_id === shop.id || f.shop_id === Number(shop.id));
    if (isFav) {
      const updated = favorites.filter(f => f.shop_id !== shop.id && f.shop_id !== Number(shop.id));
      setFavorites(updated);
      try {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('shop_id', shop.id);
      } catch (err) {
        console.warn("Failed to remove favorite in database:", err);
      }
    } else {
      const newFav = { user_id: user.id, shop_id: shop.id };
      setFavorites([...favorites, newFav]);
      try {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            shop_id: shop.id
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
        supabase.from('barbers').select('*, barbershops(*)').eq('user_id', sessionUser.id).maybeSingle()
      ]);

      const userId = sessionUser.id;
      const isOwner = !!dbBarberShop.data;
      const isBarber = !!barberProfile.data;

      // --- LOGIC FOR ACCOUNTS WITHOUT PROFILES ---
      // We removed the forced "Deleted Account" logout to prevent race conditions during registration.
      // The app will now simply fall back to default user data if no specific profile is found in DB.
      console.log("[App.tsx] Checking profile for:", cleanEmail, { isRegistering, hasDbUser: !!dbUser.data });

      // Fetch latest subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isExpired = subscription?.current_period_end && new Date(subscription.current_period_end) < new Date();
      const subActive = (subscription?.status === 'active' || subscription?.status === 'trialing') && !isExpired;
      const parentShop = dbBarberShop || barberProfile?.barbershops;

      // --- LOCKOUT LOGIC ---

      // 1. Admin Suspension (Manual)
      if (parentShop?.status === 'suspended' && subActive) {
        Alert.alert("Llogari e Bllokuar", "Salloni juaj është pezulluar nga administratori.");
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      // 2. Subscription Expiry
      if (parentShop && !subActive) {
        if (isBarber) {
          Alert.alert("Abonimi ka Skaduar", "Salloni ku punoni nuk ka abonim aktiv.");
          await supabase.auth.signOut();
          setUser(null);
          return;
        }
        // If owner, we continue but pass needsPayment flag
      }

      if (dbUser.data) {
        setUser({
          id: dbUser.data.id,
          name: dbUser.data.name || dbUser.data.full_name || email.split('@')[0],
          email: dbUser.data.email,
          role: dbUser.data.role || 'client',
          needsPayment: isOwner && !subActive // Owner with no sub
        });
      } else if (dbBarberShop.data) {
        setUser({
          id: dbBarberShop.data.id,
          name: dbBarberShop.data.name,
          email: dbBarberShop.data.email,
          role: 'owner',
          needsPayment: !subActive
        });
      } else {
        setUser({
          id: sessionUser.id,
          name: sessionUser.user_metadata?.full_name || email.split('@')[0],
          email: email,
          role: sessionUser.user_metadata?.role || 'client'
        });
      }
    } catch (err) {
      console.warn("Error fetching profile:", err);
    }
  }, [isRegistering]);

  React.useEffect(() => {
    // Check active session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        fetchUserProfile(session.user.email, session.user);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        fetchUserProfile(session.user.email, session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
        <View className="flex-1 bg-[#ECEEF2]">
          <StatusBar style="dark" />

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
              <View className="flex-1">
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
                      // If already owner, we could trigger a direct upgrade flow
                      // For now, let's just go to profile where they can manage
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
                  />
                )}
                {activeTab === 2 && (
                  isAdminRole ? (
                    <AdminDashboardScreen
                      onLogout={async () => {
                        await supabase.auth.signOut();
                        setUser(null);
                      }}
                      onImpersonate={handleImpersonate}
                    />
                  ) : isBusinessRole ? (
                    <BarberDashboardScreen
                      user={user}
                      onLogout={async () => {
                        await supabase.auth.signOut();
                        setUser(null);
                      }}
                    />
                  ) : (
                    <ActivityScreen
                      user={user}
                      onLogin={() => setActiveTab(3)}
                      onNavigateToSearch={() => setActiveTab(1)}
                    />
                  )
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
                <View className="flex-1 justify-end">
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/40"
                    activeOpacity={1}
                    onPress={() => setShowLocation(false)}
                  />
                  <View className="h-[88%] bg-white rounded-t-[40px] overflow-hidden">
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
                <View className="flex-1 justify-end">
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/40"
                    activeOpacity={1}
                    onPress={() => setShowSearch(false)}
                  />
                  <View className="h-[88%] bg-white rounded-t-[40px] overflow-hidden">
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
                <View className="flex-1 justify-end">
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/40"
                    activeOpacity={1}
                    onPress={() => {
                      setShowRegisterShop(false);
                      setSelectedPlanId(undefined);
                    }}
                  />
                  <View className="h-[95%] bg-white rounded-t-[40px] overflow-hidden">
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
                <View className="flex-1 justify-end">
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/40"
                    activeOpacity={1}
                    onPress={() => setShowAddAd(false)}
                  />
                  <View className="h-[88%] bg-white rounded-t-[40px] overflow-hidden">
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

              {/* ── MODERN ANIMATED BOTTOM BAR ────────────────────── */}
              {!selectedShop && (
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
