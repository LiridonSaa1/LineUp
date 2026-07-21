import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Home, Search, ShoppingBag, User } from "lucide-react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AdsScreen } from "./src/screens/AdsScreen";
import { BarberDetailScreen } from "./src/screens/BarberDetailScreen";
import "./global.css";

export default function App() {
  const [activeTab, setActiveTab] = React.useState(0);
  const [selectedShop, setSelectedShop] = React.useState<any>(null);

  const tabs = [
    { label: 'Home', icon: Home },
    { label: 'Search', icon: Search },
    { label: 'Shop', icon: ShoppingBag },
    { label: 'Profile', icon: User },
  ];

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-[#F8F9FE]">
        <StatusBar style="light" />

        {/* Detail Screen Modal or Main Content Switcher */}
        {selectedShop ? (
          <BarberDetailScreen shop={selectedShop} onBack={() => setSelectedShop(null)} />
        ) : (
          <>
            {activeTab === 0 && <HomeScreen onSelectShop={(shop) => setSelectedShop(shop)} />}
            {activeTab === 1 && <ExploreScreen onSelectShop={(shop) => setSelectedShop(shop)} />}
            {activeTab === 2 && <AdsScreen />}
            {activeTab === 3 && <ProfileScreen />}
          </>
        )}

        {/* ── CLEAN PURPLE BOTTOM BAR ────────────────────── */}
        {!selectedShop && (
          <View className="bg-white border-t border-slate-100/80 pt-3 pb-6 px-8 flex-row items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
            {tabs.map((tab, i) => {
              const isActive = activeTab === i;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setActiveTab(i)}
                  className="items-center justify-center py-1"
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mb-1 ${isActive ? 'bg-[#7F3DFF]/10' : 'bg-transparent'}`}>
                    <Icon size={22} color={isActive ? "#7F3DFF" : "#8789A3"} strokeWidth={isActive ? 2.5 : 2} />
                  </View>
                  <Text className={`text-[10px] font-extrabold ${isActive ? 'text-[#7F3DFF]' : 'text-[#8789A3]'}`}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </View>
    </SafeAreaProvider>
  );
}
