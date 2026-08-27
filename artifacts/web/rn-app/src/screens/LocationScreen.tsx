import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Linking, ActivityIndicator, Dimensions, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Search, Navigation, Home, Briefcase, MapPin, AlertCircle, X, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn
} from 'react-native-reanimated';
import { withTiming } from 'react-native-reanimated';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const USER_ID = 'demo_user_123'; // Placeholder until Auth is implemented

const CITY_DATA: Record<string, { lat: number; lng: number }> = {
  "Prishtinë": { lat: 42.6629, lng: 21.1655 },
  "Prizren": { lat: 42.2139, lng: 20.7397 },
  "Ferizaj": { lat: 42.3703, lng: 21.1559 },
  "Pejë": { lat: 42.6593, lng: 20.2883 },
  "Gjakovë": { lat: 42.3803, lng: 20.4308 },
  "Gjilan": { lat: 42.4635, lng: 21.4678 },
  "Mitrovicë": { lat: 42.8914, lng: 20.8660 },
  "Podujevë": { lat: 42.9114, lng: 21.1903 },
  "Vushtrri": { lat: 42.8231, lng: 20.9675 },
  "Suharekë": { lat: 42.3581, lng: 20.8250 },
  "Rahovec": { lat: 42.3994, lng: 20.6553 },
  "Drenas (Gllogoc)": { lat: 42.6227, lng: 20.8931 },
  "Lipjan": { lat: 42.5217, lng: 21.1258 },
  "Malishevë": { lat: 42.4822, lng: 20.7461 },
  "Kamenicë": { lat: 42.5781, lng: 21.5803 },
  "Viti": { lat: 42.3214, lng: 21.3583 },
  "Deçan": { lat: 42.5353, lng: 20.2878 },
  "Istog": { lat: 42.7808, lng: 20.4875 },
  "Klinë": { lat: 42.6225, lng: 20.5786 },
  "Skënderaj": { lat: 42.7478, lng: 20.7878 },
  "Dragash": { lat: 42.0622, lng: 20.6533 },
  "Fushë Kosovë": { lat: 42.6340, lng: 21.0963 },
  "Kaçanik": { lat: 42.2319, lng: 21.2581 },
  "Shtime": { lat: 42.4331, lng: 21.0397 },
  "Obiliq (Kastriot)": { lat: 42.6869, lng: 21.0733 },
  "Leposaviq": { lat: 43.1039, lng: 20.8028 },
  "Graçanicë": { lat: 42.6011, lng: 21.1931 },
  "Hani i Elezit": { lat: 42.1500, lng: 21.2967 },
  "Zveçan": { lat: 42.9031, lng: 20.8403 },
  "Shtërpcë": { lat: 42.2394, lng: 21.0264 },
  "Novobërdë": { lat: 42.6161, lng: 21.4331 },
  "Zubin Potok": { lat: 42.9131, lng: 20.6908 },
  "Junik": { lat: 42.4764, lng: 20.2781 },
  "Mamushë": { lat: 42.3314, lng: 20.7275 },
  "Ranillug": { lat: 42.4931, lng: 21.5831 },
  "Kllokot": { lat: 42.3517, lng: 21.3744 },
  "Partesh": { lat: 42.4031, lng: 21.4331 },
  "Mitrovicë e Veriut": { lat: 42.8950, lng: 20.8647 },
};

const KOSOVO_CITIES = Object.keys(CITY_DATA).sort().map(c => ({ city: c }));

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

  // Filtered cities based on search query
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return KOSOVO_CITIES;
    return KOSOVO_CITIES.filter(item =>
      item.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
    panelX.value = showAddAddress ? 0 : width;
  }, [showAddAddress]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || USER_ID;

      // 1. Fetch from user_locations table
      const { data: locData } = await supabase
        .from('user_locations')
        .select('home_address, work_address')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (locData) {
        if (locData.home_address) setHomeAddress(locData.home_address);
        if (locData.work_address) setWorkAddress(locData.work_address);
      } else if (session?.user?.user_metadata) {
        const meta = session.user.user_metadata;
        if (meta.home_address) setHomeAddress(meta.home_address);
        if (meta.work_address) setWorkAddress(meta.work_address);
      }

      // Sync offline/local fallback
      const localHome = await AsyncStorage.getItem('lineup_home_address');
      const localWork = await AsyncStorage.getItem('lineup_work_address');
      if (localHome && !homeAddress) setHomeAddress(localHome);
      if (localWork && !workAddress) setWorkAddress(localWork);

      // 2. Fetch recent searches
      const { data: recentData } = await supabase
        .from('recent_searches')
        .select('location_name')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentData && recentData.length > 0) {
        const uniqueRecents = [...new Set(recentData.map(r => r.location_name))].slice(0, 5);
        setRecents(uniqueRecents);
      } else {
        const localRecentsJson = await AsyncStorage.getItem('lineup_recent_searches');
        if (localRecentsJson) {
          setRecents(JSON.parse(localRecentsJson));
        }
      }
    } catch (e) {
      console.warn("Location data fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (city: string) => {
    const updatedRecents = [city, ...recents.filter(r => r !== city)].slice(0, 5);
    setRecents(updatedRecents);
    await AsyncStorage.setItem('lineup_recent_searches', JSON.stringify(updatedRecents));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || USER_ID;

      // Delete existing and insert fresh recent search in Supabase
      await supabase
        .from('recent_searches')
        .delete()
        .eq('user_id', currentUserId)
        .eq('location_name', city);

      await supabase.from('recent_searches').insert({
        user_id: currentUserId,
        location_name: city
      });

      // Update user_metadata in Supabase Auth
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { selected_location: city }
        });
      }
    } catch (e) {
      console.warn("Error saving recent search to Supabase:", e);
    }

    onSelectLocation(city);
  };

  const handleSaveAddress = async () => {
    if (!selectedPlace) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || USER_ID;

      const updateField = addressType === 'home' ? 'home_address' : 'work_address';
      const addressVal = selectedPlace.address;

      if (addressType === 'home') setHomeAddress(addressVal);
      else if (addressType === 'work') setWorkAddress(addressVal);

      // Save locally
      await AsyncStorage.setItem(`lineup_${updateField}`, addressVal);

      // Upsert to user_locations in Supabase
      const updateData: any = {
        user_id: currentUserId,
        [updateField]: addressVal,
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase
        .from('user_locations')
        .upsert(updateData, { onConflict: 'user_id' });

      if (upsertErr) {
        // Fallback: save to user_metadata in Supabase Auth
        if (session?.user) {
          await supabase.auth.updateUser({
            data: { [updateField]: addressVal }
          });
        }
      }

      setShowAddAddress(false);
      setSelectedPlace(null);
    } catch (e) {
      console.error(`Error saving ${addressType} address to Supabase:`, e);
    }
  };

  const handleClearRecents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || USER_ID;

      await AsyncStorage.removeItem('lineup_recent_searches');
      setRecents([]);

      await supabase
        .from('recent_searches')
        .delete()
        .eq('user_id', currentUserId);
    } catch (e) {
      console.warn("Error clearing recents in Supabase:", e);
    }
  };

  const animatedPanelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: panelX.value }],
    };
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View className="flex-1 bg-[#F5F5F5]">
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

        {/* Smart Address & City Autocomplete */}
        <AddressAutocomplete
          placeholder="Kërko qytetin, zonën ose rrugën..."
          containerClassName="mb-6 z-50"
          onChangeText={setSearchQuery}
          onSelectAddress={(place) => {
            if (place?.formatted_address) {
              handleSelect(place.formatted_address);
            }
          }}
        />

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" keyboardShouldPersistTaps="handled">
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" className="mt-10" />
          ) : (
            <View>
              {/* Only show addresses and recents if no search query */}
              {searchQuery.length === 0 && (
                <>
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
                </>
              )}

              {/* Main Cities Section */}
              <View className="mb-8">
                <Text className="text-xl font-bold text-[#161719] mb-4">
                  {searchQuery.length > 0 ? `Sygjestimat për "${searchQuery}"` : "Qytetet"}
                </Text>

                {filteredCities.length > 0 ? (
                  <View className="bg-white rounded-3xl p-2 border border-slate-100">
                    {filteredCities.map((item, index) => (
                      <TouchableOpacity
                        key={item.city}
                        onPress={() => {
                          Keyboard.dismiss();
                          handleSelect(item.city);
                        }}
                        className={`flex-row items-center py-4 px-3 ${index !== filteredCities.length - 1 ? 'border-b border-slate-50' : ''}`}
                      >
                        <MapPin size={20} color={searchQuery.length > 0 ? "#6366f1" : "#8789A3"} />
                        <Text className={`flex-1 ml-3 text-base font-bold ${searchQuery.length > 0 ? 'text-[#6366f1]' : 'text-[#161719]'}`}>
                          {item.city}
                        </Text>
                        <ChevronRight size={18} color="#cbd5e1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : searchQuery.length > 0 ? (
                  <View className="bg-white p-6 rounded-3xl items-center border border-slate-100">
                    <AlertCircle size={32} color="#8789A3" className="mb-2" />
                    <Text className="text-[#8789A3] font-bold text-center">Nuk u gjet asnjë qytet me këtë emër.</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          <View className="h-20" />
        </ScrollView>
      </View>

      {/* Add Address Sub-Modal (Slides from right) */}
      <Animated.View
        style={[animatedPanelStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ECEEF2', zIndex: 50 }]}
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

          {/* Street search */}
          <View className="flex-1">
             <AddressAutocomplete
                label="Kërko Adresën / Rrugën"
                placeholder="Kërko rrugën, qytetin ose ndërtesën..."
                selectedCity={addressType === 'home' || addressType === 'work' ? "Prishtinë" : ""} // default or context
                containerClassName="mb-6"
                onSelectAddress={(place) => {
                  if (place && place.formatted_address) {
                    setSelectedPlace({
                      address: place.formatted_address,
                      lat: place.latitude,
                      lng: place.longitude
                    });
                  } else {
                    setSelectedPlace(null);
                  }
                }}
             />

             {selectedPlace && (
                <Animated.View entering={FadeIn} className="bg-[#6366f1]/5 p-5 rounded-3xl border border-[#6366f1]/20 mb-8">
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
    </KeyboardAvoidingView>
  );
};
