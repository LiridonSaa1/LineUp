import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Home, Search, Megaphone, User } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AdsScreen } from "./src/screens/AdsScreen";
import "./global.css";

export default function App() {
  const [activeTab, setActiveTab] = React.useState(0);

  const tabs = [
    { label: 'Ballina', icon: Home },
    { label: 'Eksploro', icon: Search },
    { label: 'Reklama', icon: Megaphone },
    { label: 'Profili', icon: User },
  ];

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-[#050608]">
        <StatusBar style="light" />

        {/* Main Content Switcher */}
        {activeTab === 0 && <HomeScreen />}
        {activeTab === 1 && <ExploreScreen />}
        {activeTab === 2 && <AdsScreen />}
        {activeTab === 3 && <ProfileScreen />}

        {/* ── CUSTOM FLOATING BOTTOM BAR ────────────────────── */}
        <View className="absolute bottom-10 left-8 right-10">
          <BlurView intensity={80} tint="dark" className="flex-row h-24 items-center px-6 rounded-[40px] border border-white/10 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            {tabs.map((tab, i) => {
              const isActive = activeTab === i;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setActiveTab(i)}
                  className="flex-1 items-center justify-center"
                >
                  <View className="relative items-center justify-center p-2">
                    <Icon size={isActive ? 28 : 24} color={isActive ? "#3472ef" : "rgba(255,255,255,0.3)"} strokeWidth={isActive ? 2.5 : 1.8} />
                    {isActive && (
                      <View className="absolute -bottom-4 w-1.5 h-1.5 bg-[#3472ef] rounded-full shadow-[0_0_10px_#3472ef]" />
                    )}
                  </View>
                  <Text className={`text-[9px] font-black uppercase tracking-widest mt-2 ${isActive ? 'text-white' : 'text-white/20'}`}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </BlurView>
        </View>

      </View>
    </SafeAreaProvider>
  );
}
