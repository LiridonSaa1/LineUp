import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Linking } from 'react-native';
import { ArrowLeft, Search, Navigation, Home, Briefcase, MapPin, AlertCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const KOSOVO_CITIES = [
  "Prishtinë", "Prizren", "Pejë", "Gjakovë", "Ferizaj", "Mitrovicë", "Gjilan",
  "Podujevë", "Vushtrri", "Suharekë", "Rahovec", "Drenas", "Lipjan", "Malishevë",
  "Kamenicë", "Viti", "Deçan", "Skënderaj", "Kaçanik", "Junik", "Dragash",
  "Istog", "Klinë", "Obiliq", "Shtime", "Leposaviq", "Zveçan", "Zubin Potok",
  "Graçanicë", "Ranillug", "Partesh", "Kllokot", "Mamushë", "Novobërdë"
].sort();

interface LocationScreenProps {
  onBack: () => void;
  onSelectLocation: (location: string) => void;
}

export const LocationScreen: React.FC<LocationScreenProps> = ({ onBack, onSelectLocation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recents, setRecents] = useState<string[]>(["Pristina"]);

  const filteredCities = KOSOVO_CITIES.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (city: string) => {
    if (!recents.includes(city)) {
      setRecents([city, ...recents].slice(0, 5));
    }
    onSelectLocation(city);
  };

  const handleOpenMaps = () => {
    // This attempts to open Google Maps with a generic location or user's current view
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=Kosovo');
  };

  return (
    <View className="flex-1 bg-[#EFF2F7]">
      {/* Modal Handle */}
      <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />

      {/* Background Decorative Blobs */}
      <View className="absolute top-[100] left-[-100] w-80 h-80 bg-[#6366f1]/15 rounded-full blur-3xl" />

      <View className="flex-1 px-6 pt-2">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#161719]">Location</Text>
        </View>

        {/* Search Input */}
        <View
          className="overflow-hidden border border-[#6366f1] mb-6"
          style={{ borderRadius: 12, backgroundColor: 'white' }}
        >
          <View className="flex-row items-center px-4 h-14">
            <Search size={22} color="#6366f1" strokeWidth={2} />
            <TextInput
              placeholder="Search"
              className="flex-1 ml-3 text-lg text-[#161719] font-medium"
              placeholderTextColor="#8789A3"
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor="#6366f1"
            />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Location Warning */}
          <View className="flex-row items-start mb-8 pr-4">
            <AlertCircle size={20} color="#8789A3" />
            <Text className="flex-1 ml-3 text-[#8789A3] text-[13px] leading-5 font-medium">
              You have not allowed access to your current location. For the most accurate search results please adjust location settings.
            </Text>
          </View>

          {/* Current Location Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center mb-10"
            onPress={handleOpenMaps}
          >
            <Navigation size={22} color="#6366f1" fill="#6366f1" />
            <Text className="text-[17px] font-bold text-[#161719] ml-4">Current location</Text>
          </TouchableOpacity>

          {/* My Addresses */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-[#161719]">My addresses</Text>
            <TouchableOpacity>
              <Text className="text-[#6366f1] font-bold text-base">Manage</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-xl bg-[#6366f1]/10 items-center justify-center mr-4">
              <Home size={22} color="#6366f1" fill="#6366f1" />
            </View>
            <Text className="text-[17px] font-bold text-[#161719]">Add home</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} className="flex-row items-center mb-10">
            <View className="w-10 h-10 rounded-xl bg-[#6366f1]/10 items-center justify-center mr-4">
              <Briefcase size={22} color="#6366f1" fill="#6366f1" />
            </View>
            <Text className="text-[17px] font-bold text-[#161719]">Add work</Text>
          </TouchableOpacity>

          {/* Recents Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-[#161719]">Recents</Text>
              <TouchableOpacity onPress={() => setRecents([])}>
                <Text className="text-[#6366f1] font-bold text-base">Clear</Text>
              </TouchableOpacity>
            </View>

            {recents.map((item, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center mb-6"
                onPress={() => onSelectLocation(item)}
              >
                <View className="w-10 h-10 rounded-full bg-[#6366f1]/10 items-center justify-center mr-4">
                  <MapPin size={22} color="#6366f1" fill="#6366f1" />
                </View>
                <View>
                  <Text className="text-[17px] font-bold text-[#161719]">{item}</Text>
                  <Text className="text-[13px] text-[#8789A3] font-medium">{item}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View className="h-[1px] bg-gray-200 mb-8" />

          {/* Cities List */}
          <Text className="text-xl font-black text-[#161719] mb-5">Cities in Kosovo</Text>
          <View className="overflow-hidden rounded-3xl border border-white/60 bg-white/40 shadow-sm mb-10">
            <BlurView intensity={30} tint="light">
              {filteredCities.map((city, index) => (
                <TouchableOpacity
                  key={city}
                  className={`flex-row items-center py-4 px-4 ${
                    index !== filteredCities.length - 1 ? 'border-b border-white/40' : ''
                  } active:bg-white/30`}
                  onPress={() => handleSelect(city)}
                >
                  <View className="w-10 h-10 rounded-full bg-white/50 items-center justify-center mr-4 border border-white/60">
                    <MapPin size={18} color="#6366f1" />
                  </View>
                  <Text className="text-[17px] font-bold text-[#161719]">{city}</Text>
                </TouchableOpacity>
              ))}
            </BlurView>
          </View>

          {filteredCities.length === 0 && (
            <View className="items-center py-10">
              <Text className="text-[#8789A3] font-bold">No cities found matching "{searchQuery}"</Text>
            </View>
          )}

          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};
