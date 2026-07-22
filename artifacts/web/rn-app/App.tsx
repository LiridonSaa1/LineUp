import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity, Text, Dimensions, Platform, Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Home, Search, Megaphone, User } from "lucide-react-native";
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
} from "react-native-reanimated";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AdsScreen } from "./src/screens/AdsScreen";
import { BarberDetailScreen } from "./src/screens/BarberDetailScreen";
import { LocationScreen } from "./src/screens/LocationScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
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

export default function App() {
  const [activeTab, setActiveTab] = React.useState(0);
  const [selectedShop, setSelectedShop] = React.useState<any>(null);
  const [cityFilter, setCityFilter] = React.useState("Të gjitha");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchCoords, setSearchCoords] = React.useState<{ lat?: number; lng?: number }>({});
  const [showLocation, setShowLocation] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState("Current location");

  const tabPosition = useSharedValue(0);

  React.useEffect(() => {
    tabPosition.value = withSpring(activeTab * TAB_WIDTH, { damping: 15, stiffness: 120 });
  }, [activeTab]);

  const handleCitySelect = (city: string) => {
    setCityFilter(city);
    setActiveTab(1); // Switch to Explore/Search tab
  };

  const handleSearch = (filters: { query: string; city: string; lat?: number; lng?: number }) => {
    setSearchQuery(filters.query);
    setCityFilter(filters.city);
    setSearchCoords({ lat: filters.lat, lng: filters.lng });
    setSelectedLocation(filters.city);
    setShowSearch(false);
    setActiveTab(1); // Switch to Explore tab
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const tabs = [
    { label: 'Home', icon: Home },
    { label: 'Search', icon: Search },
    { label: 'Reklama', icon: Megaphone },
    { label: 'Profile', icon: User },
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
    <SafeAreaProvider>
      <View className="flex-1 bg-[#F8F9FE]">
        <StatusBar style="dark" />

        {/* Detail Screen Modal or Main Content Switcher */}
        {selectedShop ? (
          <BarberDetailScreen shop={selectedShop} onBack={() => setSelectedShop(null)} />
        ) : (
          <View className="flex-1">
            {activeTab === 0 && (
              <HomeScreen
                onSelectShop={(shop) => setSelectedShop(shop)}
                onOpenLocation={() => setShowLocation(true)}
                onOpenSearch={() => setShowSearch(true)}
                selectedLocation={selectedLocation}
              />
            )}
            {activeTab === 1 && (
              <ExploreScreen
                onSelectShop={(shop) => setSelectedShop(shop)}
                onOpenSearch={() => setShowSearch(true)}
                initialCity={cityFilter}
                initialSearch={searchQuery}
                initialCoords={searchCoords}
              />
            )}
            {activeTab === 2 && <AdsScreen />}
            {activeTab === 3 && <ProfileScreen />}
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
                  setCityFilter(loc); // Keep initialCity in sync for ExploreScreen
                  setShowLocation(false);
                  setActiveTab(1); // Navigate to ExploreScreen
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
                {/* Apple-style Frosted Indicator */}
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

      </View>
    </SafeAreaProvider>
  );
}
