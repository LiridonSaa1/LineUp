import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { ArrowLeft, Search, Navigation, Home, Briefcase, MapPin, AlertCircle, X, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { withTiming } from 'react-native-reanimated';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { supabase } from '@/config/supabase';

const { width, height } = Dimensions.get('window');
const USER_ID = 'demo_user_123'; // Placeholder until Auth is implemented

// IMPORTANT: Replace this with your actual Google Maps API Key
const GOOGLE_MAPS_KEY = 'YOUR_GOOGLE_API_KEY';

interface LocationScreenProps {
  onBack: () => void;
  onSelectLocation: (location: string) => void;
}

export const LocationScreen: React.FC<LocationScreenProps> = ({ onBack, onSelectLocation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [homeAddress, setHomeAddress] = useState<string | null>(null);
  const [workAddress, setWorkAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Address Panel States
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressType, setAddressType] = useState<'home' | 'work' | 'other'>('other');
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat?: number; lng?: number } | null>(null);

  const autocompleteRef = useRef<any>(null);

  const openAddAddress = (type: 'home' | 'work' | 'other') => {
    setAddressType(type);
    setSelectedPlace(null);
    setShowAddAddress(true);
    if (autocompleteRef.current) autocompleteRef.current.setAddressText("");
  };

  const panelX = useSharedValue(width);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    panelX.value = withSpring(showAddAddress ? 0 : width, { damping: 20, stiffness: 90 });
  }, [showAddAddress]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: locData } = await supabase
        .from('user_locations')
        .select('home_address, work_address')
        .eq('user_id', USER_ID)
        .maybeSingle();

      if (locData) {
        setHomeAddress(locData.home_address);
        setWorkAddress(locData.work_address);
      }

      const { data: recentData } = await supabase
        .from('recent_searches')
        .select('location_name')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentData) {
        const uniqueRecents = [...new Set(recentData.map(r => r.location_name))].slice(0, 5);
        setRecents(uniqueRecents);
      }
    } catch (e) {
      console.error("Failed to fetch location data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (city: string) => {
    const updatedRecents = [city, ...recents.filter(r => r !== city)].slice(0, 5);
    setRecents(updatedRecents);

    try {
      await supabase
        .from('recent_searches')
        .delete()
        .eq('user_id', USER_ID)
        .eq('location_name', city);

      await supabase.from('recent_searches').insert({
        user_id: USER_ID,
        location_name: city
      });
    } catch (e) {
      console.error("Error saving recent search:", e);
    }

    onSelectLocation(city);
  };

  const handleSaveAddress = async () => {
    if (!selectedPlace) return;

    try {
      const updateData = addressType === 'home'
        ? { home_address: selectedPlace.address, user_id: USER_ID }
        : { work_address: selectedPlace.address, user_id: USER_ID };

      const { error } = await supabase
        .from('user_locations')
        .upsert(updateData, { onConflict: 'user_id' });

      if (!error) {
        if (addressType === 'home') setHomeAddress(selectedPlace.address);
        else if (addressType === 'work') setWorkAddress(selectedPlace.address);
        setShowAddAddress(false);
        setSelectedPlace(null);
      }
    } catch (e) {
      console.error(`Error saving ${addressType} address:`, e);
    }
  };

  const handleClearRecents = async () => {
    try {
      const { error } = await supabase
        .from('recent_searches')
        .delete()
        .eq('user_id', USER_ID);

      if (!error) {
        setRecents([]);
      }
    } catch (e) {
      console.error("Error clearing recents:", e);
    }
  };

  const animatedPanelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: panelX.value }],
    };
  });

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

        {/* Search Input - Main list search */}
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
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" className="mt-10" />
          ) : searchQuery.length === 0 ? (
            <View>
              {/* My Addresses */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-[#161719]">My addresses</Text>
                <TouchableOpacity onPress={() => openAddAddress('other')}>
                  <Text className="text-[#6366f1] font-bold text-base">Manage</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center mb-6"
                onPress={() => {
                  if (homeAddress) handleSelect(homeAddress);
                  else openAddAddress('home');
                }}
              >
                <View className="w-10 h-10 rounded-xl bg-[#6366f1]/10 items-center justify-center mr-4">
                  <Home size={22} color="#6366f1" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-[#161719]">{homeAddress || "Add home"}</Text>
                  {!homeAddress && (
                    <Text className="text-[12px] text-[#6366f1] font-medium">Set your home address</Text>
                  )}
                </View>
                <ChevronRight size={18} color="#8789A3" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center mb-10"
                onPress={() => {
                  if (workAddress) handleSelect(workAddress);
                  else openAddAddress('work');
                }}
              >
                <View className="w-10 h-10 rounded-xl bg-[#6366f1]/10 items-center justify-center mr-4">
                  <Briefcase size={22} color="#6366f1" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-[#161719]">{workAddress || "Add work"}</Text>
                  {!workAddress && (
                    <Text className="text-[12px] text-[#6366f1] font-medium">Set your work address</Text>
                  )}
                </View>
                <ChevronRight size={18} color="#8789A3" />
              </TouchableOpacity>

              {/* Recents Section */}
              {recents.length > 0 && (
                <View className="mb-8">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-bold text-[#161719]">Recents</Text>
                    <TouchableOpacity onPress={handleClearRecents}>
                      <Text className="text-[#6366f1] font-bold text-base">Clear</Text>
                    </TouchableOpacity>
                  </View>

                  {recents.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      className="flex-row items-center mb-6"
                      onPress={() => handleSelect(item)}
                    >
                      <View className="w-10 h-10 rounded-full bg-[#6366f1]/10 items-center justify-center mr-4">
                        <MapPin size={22} color="#6366f1" strokeWidth={2} />
                      </View>
                      <View>
                        <Text className="text-[17px] font-bold text-[#161719]">{item}</Text>
                        <Text className="text-[13px] text-[#8789A3] font-medium">{item}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
             <View className="mb-10">
                {/* Search Suggestion results (Simplified mock or actual search results could go here) */}
                <Text className="text-sm font-bold text-[#8789A3] uppercase mb-4">Results for "{searchQuery}"</Text>
                <TouchableOpacity
                  onPress={() => handleSelect(searchQuery)}
                  className="bg-white p-5 rounded-3xl flex-row items-center border border-slate-100"
                >
                  <MapPin size={20} color="#6366f1" className="mr-4" />
                  <Text className="text-lg font-bold text-[#161719]">{searchQuery}</Text>
                </TouchableOpacity>
             </View>
          )}

          <View className="h-20" />
        </ScrollView>
      </View>

      {/* Add Address Sub-Modal (Slides from right) */}
      <Animated.View
        style={[animatedPanelStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#EFF2F7', zIndex: 50 }]}
      >
        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-2" />

        <View className="flex-1 px-6 pt-2">
          {/* Header */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => setShowAddAddress(false)} className="mr-4">
              <ArrowLeft size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-[#161719]">
              {addressType === 'home' ? 'Add Home Address' : addressType === 'work' ? 'Add Work Address' : 'Add New Address'}
            </Text>
          </View>

          {/* Google Places Autocomplete Search */}
          <View className="flex-1">
             <Text className="text-sm font-bold text-[#8789A3] uppercase tracking-widest mb-3 ml-1">Search Address</Text>

             <GooglePlacesAutocomplete
                ref={autocompleteRef}
                placeholder='Search for street, building...'
                fetchDetails={true}
                onPress={(data, details = null) => {
                  setSelectedPlace({
                    address: data.description,
                    lat: details?.geometry?.location?.lat,
                    lng: details?.geometry?.location?.lng
                  });
                }}
                query={{
                  key: GOOGLE_MAPS_KEY,
                  language: 'sq',
                  components: 'country:ks',
                }}
                styles={{
                  container: { flex: 0, marginBottom: 20 },
                  textInputContainer: {
                    backgroundColor: 'white',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#6366f1',
                    paddingHorizontal: 8
                  },
                  textInput: {
                    height: 54,
                    fontSize: 16,
                    color: '#161719',
                    fontWeight: '500'
                  },
                  listView: {
                    backgroundColor: 'white',
                    borderRadius: 20,
                    marginTop: 10,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  },
                  row: {
                    padding: 15,
                    height: 60,
                    flexDirection: 'row',
                  },
                  separator: {
                    height: 1,
                    backgroundColor: '#F1F5F9',
                  },
                  description: {
                    fontSize: 15,
                    color: '#161719',
                  },
                }}
                renderLeftButton={() => (
                   <View className="justify-center pl-2">
                      <Search size={20} color="#6366f1" />
                   </View>
                )}
             />

             {selectedPlace && (
                <Animated.View entering={withTiming} className="bg-[#6366f1]/5 p-5 rounded-3xl border border-[#6366f1]/20 mb-8">
                   <Text className="text-xs font-black text-[#6366f1] uppercase mb-2">Selected Location</Text>
                   <View className="flex-row items-start">
                      <MapPin size={20} color="#6366f1" className="mt-1 mr-3" />
                      <Text className="flex-1 text-[#161719] font-bold text-lg leading-6">{selectedPlace.address}</Text>
                   </View>
                </Animated.View>
             )}

             <TouchableOpacity
                onPress={handleSaveAddress}
                disabled={!selectedPlace}
                className={`h-16 rounded-3xl items-center justify-center shadow-lg ${!selectedPlace ? 'bg-slate-300' : 'bg-black'}`}
             >
                <Text className="text-white font-black text-lg">Save Address</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};
